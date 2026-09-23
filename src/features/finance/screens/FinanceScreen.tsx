import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import LifePills from '../../../shared/components/Pills/LifePills.tsx';
import LifeFab from '../../../shared/components/Fab/LifeFab.tsx';
import SyncStatusBanner from '../../main/components/SyncStatusBanner.tsx';
import { usePendingSyncStore } from '../../../store/pendingSync.store.ts';
import type { DisplayTransaction } from '../../../types/pendingSync.types.ts';
import SummaryCard from '../components/SummaryCard.tsx';
import SpendingBreakdownCard from '../components/SpendingBreakdownCard.tsx';
import InsightCard from '../components/InsightCard.tsx';
import TransactionListItem from '../components/TransactionListItem.tsx';
import MonthNavigator from '../components/MonthNavigator.tsx';
import MonthPickerModal from '../components/MonthPickerModal.tsx';
import { useFinanceSummary } from '../hooks/useFinanceSummary.ts';
import { groupTransactionsByDay } from '../utils/groupTransactionsByDay.ts';
import { formatUzs } from '../utils/formatMoney.ts';
import {
  currentYearMonth,
  formatMonthName,
  shiftYearMonth,
} from '../utils/month.ts';
import type { FinanceScreenProps } from './type.ts';

type TransactionFilter = 'All' | 'Expenses' | 'Income';

const FILTERS: TransactionFilter[] = ['All', 'Expenses', 'Income'];

const SectionTitle = ({ title }: { title: string }) => (
  <LifeText variant="bodySm" color="text-life-muted" className="font-semibold">
    {title}
  </LifeText>
);

const EmptyCard = ({ message }: { message: string }) => (
  <View className="items-center rounded-life-lg border border-life-border bg-life-surface p-life-6">
    <LifeText variant="bodySm" color="text-life-muted">
      {message}
    </LifeText>
  </View>
);

const FinanceScreen = ({ navigation }: FinanceScreenProps) => {
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter>('All');
  const {
    transactions,
    summary,
    previousSummary,
    insight,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useFinanceSummary(yearMonth);
  const retryEntry = usePendingSyncStore(state => state.retryEntry);
  const discardEntry = usePendingSyncStore(state => state.discardEntry);

  useEffect(() => {
    if (isError) {
      console.error('[FinanceScreen] Failed to load transactions', error);
    }
  }, [isError, error]);

  const sections = useMemo(() => {
    const filtered = (transactions ?? []).filter(item =>
      filter === 'All'
        ? true
        : filter === 'Income'
        ? item.type === 'income'
        : item.type === 'expense',
    );
    return groupTransactionsByDay(filtered);
  }, [transactions, filter]);

  const openForm = (params: { transactionId?: string } = {}) => {
    navigation.navigate('TransactionForm', { ...params, yearMonth });
  };

  const openEditor = (transaction: DisplayTransaction) => {
    openForm({ transactionId: transaction.id });
  };

  const handleTransactionPress = (transaction: DisplayTransaction) => {
    if (transaction.syncStatus !== 'failed') {
      openEditor(transaction);
      return;
    }
    Alert.alert(
      'Sync failed',
      "This transaction couldn't be saved to your account. Retry, edit it, or discard your unsynced changes.",
      [
        { text: 'Retry', onPress: () => retryEntry(transaction.id) },
        { text: 'Edit', onPress: () => openEditor(transaction) },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => discardEntry(transaction.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const hasTransactions = (transactions ?? []).length > 0;

  const renderTransactions = () => {
    if (!hasTransactions) {
      return (
        <View className="items-center gap-life-4 rounded-life-2xl border border-life-border bg-life-surface p-life-6">
          <LifeText variant="display">💸</LifeText>
          <View className="items-center gap-life-1">
            <LifeText variant="h3" className="font-bold">
              Nothing here yet
            </LifeText>
            <LifeText
              variant="bodySm"
              color="text-life-muted"
              className="text-center"
            >
              Add your first income or expense to see where your money goes.
            </LifeText>
          </View>
          <LifeButton
            title="Add transaction"
            onPress={() => openForm()}
            fullWidth
          />
        </View>
      );
    }

    return (
      <View className="gap-life-4">
        <View className="gap-life-3">
          <SectionTitle title="TRANSACTIONS" />
          <LifePills options={FILTERS} value={filter} onChange={setFilter} />
        </View>
        {sections.length === 0 ? (
          <EmptyCard message={`No ${filter.toLowerCase()} this month.`} />
        ) : (
          sections.map(section => (
            <View key={section.key} className="gap-life-2">
              <View className="flex-row items-center justify-between px-life-1">
                <LifeText
                  variant="bodySm"
                  className="font-semibold text-life-text"
                >
                  {section.label}
                </LifeText>
                <LifeText
                  variant="caption"
                  color={
                    section.net < 0 ? 'text-life-muted' : 'text-life-success'
                  }
                >
                  {section.net < 0 ? '−' : '+'}
                  {formatUzs(Math.abs(section.net))}
                </LifeText>
              </View>
              {section.data.map(transaction => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={handleTransactionPress}
                />
              ))}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="items-center py-life-10">
          <ActivityIndicator color="#6366F1" />
        </View>
      );
    }
    if (isError && !transactions) {
      return (
        <View className="gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-4">
          <LifeText variant="bodySm" color="text-life-danger">
            Couldn't load your transactions.
          </LifeText>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => refetch()}
          >
            <LifeText
              variant="bodySm"
              className="font-semibold text-life-accent"
            >
              Retry
            </LifeText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <SummaryCard summary={summary} previousSummary={previousSummary} />

        {summary.categories.length > 0 ? (
          <>
            {insight ? (
              <InsightCard
                insight={insight}
                previousMonthName={formatMonthName(
                  shiftYearMonth(yearMonth, -1),
                )}
              />
            ) : null}
            <View className="gap-life-3">
              <SectionTitle title="WHERE YOUR MONEY GOES" />
              <SpendingBreakdownCard
                categories={summary.categories}
                noun="spending"
                topLabel="Biggest"
              />
            </View>
          </>
        ) : null}

        {summary.incomeCategories.length > 0 ? (
          <View className="gap-life-3">
            <SectionTitle title="WHERE IT COMES FROM" />
            <SpendingBreakdownCard
              categories={summary.incomeCategories}
              noun="income"
              topLabel="Main source"
            />
          </View>
        ) : null}

        {renderTransactions()}
      </>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Extra bottom space keeps the last row clear of the floating button. */}
        <View className="gap-life-5 px-life-5 pb-[96px] pt-life-3">
          <LifeText variant="h1" className="font-bold">
            Finance
          </LifeText>

          <MonthNavigator
            yearMonth={yearMonth}
            onChange={setYearMonth}
            onPressLabel={() => setMonthPickerVisible(true)}
          />

          <SyncStatusBanner />

          {renderBody()}
        </View>
      </ScrollView>

      <LifeFab
        accessibilityLabel="Add transaction"
        onPress={() => openForm()}
      />

      <MonthPickerModal
        visible={monthPickerVisible}
        value={yearMonth}
        onClose={() => setMonthPickerVisible(false)}
        onSelect={selected => {
          setYearMonth(selected);
          setMonthPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

export default FinanceScreen;
