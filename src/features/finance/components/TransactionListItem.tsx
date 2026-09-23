import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import SyncStatusBadge from '../../../shared/components/SyncStatusBadge/SyncStatusBadge.tsx';
import type { DisplayTransaction } from '../../../types/pendingSync.types.ts';
import { emojiFor } from '../utils/categories.ts';
import { formatUzs } from '../utils/formatMoney.ts';

type TransactionListItemProps = {
  transaction: DisplayTransaction;
  onPress: (transaction: DisplayTransaction) => void;
};

const TransactionListItem = ({
  transaction,
  onPress,
}: TransactionListItemProps) => {
  const isIncome = transaction.type === 'income';
  const emoji = emojiFor(transaction.category, transaction.type);
  const categoryName =
    transaction.category ?? (isIncome ? 'Income' : 'Expense');
  const label = transaction.title ?? categoryName;
  const subtitle = [
    transaction.title ? categoryName : isIncome ? 'Income' : 'Expense',
    transaction.receipt_path ? '📎 Receipt' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${
        isIncome ? 'income' : 'expense'
      } ${formatUzs(transaction.amount)}`}
      onPress={() => onPress(transaction)}
      className="flex-row items-center gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-3"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-life-bg">
        <LifeText variant="body">{emoji}</LifeText>
      </View>
      <View className="flex-1 gap-life-1">
        <LifeText variant="body" className="font-medium" numberOfLines={1}>
          {label}
        </LifeText>
        <LifeText variant="caption" color="text-life-muted" numberOfLines={1}>
          {subtitle}
        </LifeText>
      </View>
      <View className="items-end gap-life-1">
        <LifeText
          variant="body"
          color={isIncome ? 'text-life-success' : 'text-life-text'}
          className="font-semibold"
        >
          {isIncome ? '+' : '−'}
          {formatUzs(transaction.amount)}
        </LifeText>
        <SyncStatusBadge status={transaction.syncStatus} />
      </View>
    </TouchableOpacity>
  );
};

export default TransactionListItem;
