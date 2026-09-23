import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeInput from '../../../shared/components/Input/LifeInput.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import AmountInput from '../components/AmountInput.tsx';
import CategoryPicker from '../components/CategoryPicker.tsx';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TYPE_EMOJI,
  defaultCategoryFor,
} from '../utils/categories.ts';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus.ts';
import { receiptService } from '../../../services/receipt.service.ts';
import { MAX_IMAGE_BYTES } from '../../../services/imageStorage.service.ts';
import type {
  CreateTransactionInput,
  TransactionCategory,
  TransactionType,
} from '../../../types/transaction.types.ts';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useMonthTransactionsWithPending,
  useUpdateTransaction,
} from '../hooks/useTransactions.ts';
import {
  MAX_AMOUNT,
  formatAmountInput,
  parseAmountInput,
} from '../utils/formatMoney.ts';
import { currentYearMonth } from '../utils/month.ts';
import type { TransactionFormScreenProps } from './type.ts';

type TypeOption = 'Expense' | 'Income';
type PhotoState = { uri: string } | 'removed' | null;

const TITLE_MAX_LENGTH = 120;

const typeFromOption: Record<TypeOption, TransactionType> = {
  Expense: 'expense',
  Income: 'income',
};

function toDateString(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function daysAgo(count: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return date;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const TransactionFormScreen = ({
  navigation,
  route,
}: TransactionFormScreenProps) => {
  const transactionId = route.params?.transactionId;
  const isEdit = Boolean(transactionId);
  const { isOnline } = useNetworkStatus();

  const { transactions } = useMonthTransactionsWithPending(
    route.params?.yearMonth ?? currentYearMonth(),
  );
  const existing = transactionId
    ? transactions?.find(item => item.id === transactionId)
    : undefined;

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [typeOption, setTypeOption] = useState<TypeOption>('Expense');
  const [amountText, setAmountText] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [category, setCategory] = useState<TransactionCategory>('Food');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photo, setPhoto] = useState<PhotoState>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Populate once per record so a background refetch never overwrites what the
  // user is typing.
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  useEffect(() => {
    if (!existing || existing.id === hydratedId) {
      return;
    }
    setTypeOption(existing.type === 'income' ? 'Income' : 'Expense');
    setAmountText(existing.amount.toLocaleString('en-US'));
    setCategory(existing.category ?? defaultCategoryFor(existing.type));
    setTitle(existing.title ?? '');
    setDate(new Date(`${existing.occurred_on}T00:00:00`));
    setHydratedId(existing.id);
  }, [existing, hydratedId]);

  const receiptPath = existing?.receipt_path;
  useEffect(() => {
    let cancelled = false;
    if (receiptPath) {
      receiptService
        .getReceiptUrl(receiptPath)
        .then(url => {
          if (!cancelled) {
            setPreviewUrl(url);
          }
        })
        .catch(error => {
          console.error('[TransactionForm] Failed to load receipt', error);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [receiptPath]);

  const type = typeFromOption[typeOption];
  const displayPhotoUri =
    photo === 'removed' ? null : photo ? photo.uri : previewUrl;

  const selectedDay = toDateString(date);
  const isToday = selectedDay === toDateString(new Date());
  const isYesterday = selectedDay === toDateString(daysAgo(1));

  // Categories differ per type, so switching type picks that type's default.
  const handleTypeChange = (option: TypeOption) => {
    if (option === typeOption) {
      return;
    }
    setTypeOption(option);
    setCategory(defaultCategoryFor(typeFromOption[option]));
  };

  const handleAmountChange = (text: string) => {
    setAmountText(formatAmountInput(text));
    setAmountError(undefined);
  };

  const handleQuickAdd = (increment: number) => {
    const current = parseAmountInput(amountText) ?? 0;
    setAmountText(
      formatAmountInput(String(Math.min(current + increment, MAX_AMOUNT))),
    );
    setAmountError(undefined);
  };

  const selectQuickDate = (selected: Date) => {
    setDate(selected);
    setShowDatePicker(false);
  };

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1280,
      maxHeight: 1280,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert(result.errorMessage ?? 'Failed to pick image.');
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      Alert.alert('Please choose a photo under 2MB.');
      return;
    }
    setPhoto({ uri: asset.uri });
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selected) {
      setDate(selected);
    }
  };

  const handleSubmit = async () => {
    const amount = parseAmountInput(amountText);
    if (!amount || amount <= 0) {
      setAmountError('Enter an amount greater than 0.');
      return;
    }
    if (photo !== null && !isOnline) {
      Alert.alert(
        "You're offline",
        'Receipt changes need a connection. Undo the receipt change to save offline, or try again when you reconnect.',
      );
      return;
    }

    const keepingExistingReceipt = photo === null;
    const trimmedTitle = title.trim();
    const input: CreateTransactionInput = {
      type,
      amount,
      category,
      title: trimmedTitle ? trimmedTitle : null,
      occurred_on: toDateString(date),
      receipt_path: keepingExistingReceipt
        ? existing?.receipt_path ?? null
        : null,
    };

    setLoading(true);
    try {
      if (photo !== null && existing?.receipt_path) {
        // A leftover file is harmless; don't block saving on it.
        await receiptService
          .deleteReceipt(existing.receipt_path)
          .catch(error => {
            console.error('[TransactionForm] Failed to delete receipt', error);
          });
      }

      const saved =
        isEdit && transactionId
          ? await updateTransaction.mutateAsync({ id: transactionId, input })
          : await createTransaction.mutateAsync(input);

      if (photo && photo !== 'removed') {
        const path = await receiptService.uploadReceipt(saved.id, photo.uri);
        await updateTransaction.mutateAsync({
          id: saved.id,
          input: { receipt_path: path },
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('[TransactionForm] Failed to save transaction', error);
      Alert.alert(
        'Could not save transaction',
        'Please check the details and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!transactionId) {
      return;
    }
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        'Deleting a transaction needs a connection. Please try again when you reconnect.',
      );
      return;
    }
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (existing?.receipt_path) {
              await receiptService
                .deleteReceipt(existing.receipt_path)
                .catch(error => {
                  console.error(
                    '[TransactionForm] Failed to delete receipt',
                    error,
                  );
                });
            }
            await deleteTransaction.mutateAsync(transactionId);
            navigation.goBack();
          } catch (error) {
            console.error('[TransactionForm] Failed to delete', error);
            Alert.alert('Could not delete transaction. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <View className="h-12 flex-row items-center justify-between px-life-4">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={() => navigation.goBack()}
        >
          <LifeText variant="body" className="text-life-accent">
            Cancel
          </LifeText>
        </TouchableOpacity>
        <LifeText variant="h3" className="font-bold">
          {isEdit ? 'Edit Transaction' : 'New Transaction'}
        </LifeText>
        <View className="w-14" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-life-5 px-life-5 pb-life-10 pt-life-3"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row rounded-full border border-life-border bg-life-surface p-life-1">
          {(['Expense', 'Income'] as TypeOption[]).map(option => {
            const active = option === typeOption;
            const activeClass =
              option === 'Expense' ? 'bg-life-danger/20' : 'bg-life-success/20';
            const activeText =
              option === 'Expense' ? 'text-life-danger' : 'text-life-success';
            return (
              <TouchableOpacity
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => handleTypeChange(option)}
                className={`flex-1 items-center rounded-full py-life-3 ${
                  active ? activeClass : ''
                }`}
              >
                <LifeText
                  variant="body"
                  color={active ? activeText : 'text-life-muted'}
                  className="font-semibold"
                >
                  {TYPE_EMOJI[typeFromOption[option]]} {option}
                </LifeText>
              </TouchableOpacity>
            );
          })}
        </View>

        <AmountInput
          value={amountText}
          onChangeText={handleAmountChange}
          onQuickAdd={handleQuickAdd}
          error={amountError}
          autoFocus={!isEdit}
        />

        <View className="gap-life-2">
          <LifeText variant="bodySm" className="font-medium text-life-muted">
            {type === 'expense' ? 'Category' : 'Source'}
          </LifeText>
          <CategoryPicker
            categories={
              type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
            }
            value={category}
            onChange={setCategory}
          />
        </View>

        <LifeInput
          label="Note (optional)"
          placeholder={
            type === 'expense' ? 'e.g. Lunch with team' : 'e.g. Salary'
          }
          value={title}
          onChangeText={setTitle}
          maxLength={TITLE_MAX_LENGTH}
        />

        <View className="gap-life-2">
          <LifeText variant="bodySm" className="font-medium text-life-muted">
            Date
          </LifeText>
          <View className="flex-row gap-life-2">
            {[
              {
                label: 'Today',
                active: isToday,
                onPress: () => selectQuickDate(new Date()),
              },
              {
                label: 'Yesterday',
                active: isYesterday,
                onPress: () => selectQuickDate(daysAgo(1)),
              },
              {
                label:
                  isToday || isYesterday
                    ? '📅 Pick date'
                    : `📅 ${formatDateLabel(date)}`,
                active: !isToday && !isYesterday,
                onPress: () => setShowDatePicker(true),
              },
            ].map(chip => (
              <TouchableOpacity
                key={chip.label}
                accessibilityRole="button"
                accessibilityState={{ selected: chip.active }}
                onPress={chip.onPress}
                className={`items-center rounded-full border px-life-4 py-life-2 ${
                  chip.active
                    ? 'border-life-primary bg-life-primary'
                    : 'border-life-border bg-life-surface'
                }`}
              >
                <LifeText
                  variant="bodySm"
                  color={chip.active ? 'text-life-text' : 'text-life-muted'}
                  className="font-semibold"
                >
                  {chip.label}
                </LifeText>
              </TouchableOpacity>
            ))}
          </View>
          {showDatePicker && (
            <View className="overflow-hidden rounded-life-md border border-life-border bg-life-surface p-life-3">
              <DateTimePicker
                value={date}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                accentColor="#6366F1"
                onChange={handleDateChange}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setShowDatePicker(false)}
                  className="items-end pt-life-2"
                >
                  <LifeText
                    variant="bodySm"
                    className="font-semibold text-life-accent"
                  >
                    Done
                  </LifeText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View className="gap-life-2">
          <LifeText variant="bodySm" className="font-medium text-life-muted">
            Receipt
          </LifeText>
          {displayPhotoUri ? (
            <View className="gap-life-2">
              <Image
                source={{ uri: displayPhotoUri }}
                className="h-40 w-full rounded-life-md"
                resizeMode="cover"
                accessibilityLabel="Receipt photo"
              />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setPhoto('removed')}
              >
                <LifeText
                  variant="bodySm"
                  className="font-semibold text-life-danger"
                >
                  Remove Receipt
                </LifeText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handlePickPhoto}
              className="items-center rounded-life-md border border-dashed border-life-border bg-life-surface p-life-6"
            >
              <LifeText variant="bodySm" color="text-life-muted">
                Tap to add a receipt photo
              </LifeText>
            </TouchableOpacity>
          )}
        </View>

        <View className="items-center pt-life-4">
          <LifeButton
            title={
              loading
                ? 'Saving...'
                : isEdit
                ? 'Save Changes'
                : 'Add Transaction'
            }
            disabled={loading}
            onPress={handleSubmit}
            fullWidth
          />
        </View>

        {isEdit && (
          <TouchableOpacity
            accessibilityRole="button"
            className="items-center"
            onPress={handleDelete}
          >
            <LifeText
              variant="bodySm"
              className="font-semibold text-life-danger"
            >
              Delete Transaction
            </LifeText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionFormScreen;
