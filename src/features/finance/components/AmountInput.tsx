import { TextInput, TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import { MAX_AMOUNT_DIGITS } from '../utils/formatMoney.ts';

// Digits plus the thousands separators formatAmountInput inserts.
const MAX_INPUT_LENGTH =
  MAX_AMOUNT_DIGITS + Math.floor((MAX_AMOUNT_DIGITS - 1) / 3);

type AmountInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onQuickAdd: (amount: number) => void;
  error?: string;
  autoFocus?: boolean;
};

const QUICK_AMOUNTS: { label: string; amount: number }[] = [
  { label: '+10k', amount: 10_000 },
  { label: '+50k', amount: 50_000 },
  { label: '+100k', amount: 100_000 },
  { label: '+500k', amount: 500_000 },
];

// Shrinks through the LifeOS type scale as the amount gets longer so it always
// fits inside the field.
function amountSizeClass(length: number): string {
  if (length <= 10) {
    return 'text-life-display';
  }
  if (length <= 12) {
    return 'text-life-h1';
  }
  if (length <= 14) {
    return 'text-life-h2';
  }
  return 'text-life-h3';
}

const AmountInput = ({
  value,
  onChangeText,
  onQuickAdd,
  error,
  autoFocus = false,
}: AmountInputProps) => (
  <View className="gap-life-3">
    <View
      className={`items-center gap-life-1 rounded-life-2xl border bg-life-surface px-life-4 py-life-5 ${
        error ? 'border-life-danger' : 'border-life-border'
      }`}
    >
      <View className="flex-row items-baseline justify-center gap-life-2">
        <TextInput
          accessibilityLabel="Amount in UZS"
          className={`min-w-[60px] text-center font-inter font-bold text-life-text ${amountSizeClass(
            value.length,
          )}`}
          placeholder="0"
          placeholderTextColor="#5F5F6B"
          keyboardType="number-pad"
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          maxLength={MAX_INPUT_LENGTH}
        />
        <LifeText
          variant="h3"
          color="text-life-muted"
          className="font-semibold"
        >
          UZS
        </LifeText>
      </View>
      {error ? (
        <LifeText variant="caption" color="text-life-danger">
          {error}
        </LifeText>
      ) : null}
    </View>

    <View className="flex-row gap-life-2">
      {QUICK_AMOUNTS.map(item => (
        <TouchableOpacity
          key={item.label}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.amount.toLocaleString('en-US')} UZS`}
          onPress={() => onQuickAdd(item.amount)}
          className="flex-1 items-center rounded-full border border-life-border bg-life-surface py-life-2"
        >
          <LifeText
            variant="bodySm"
            color="text-life-accent"
            className="font-semibold"
          >
            {item.label}
          </LifeText>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default AmountInput;
