import { View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import type { FinanceSummary } from '../utils/financeSummary.ts';
import { percentChange } from '../utils/financeSummary.ts';
import { formatUzs } from '../utils/formatMoney.ts';

type SummaryCardProps = {
  summary: FinanceSummary;
  previousSummary: FinanceSummary | null;
};

type ChangeLineProps = {
  current: number;
  previous: number | undefined;
  // Rising income is good news, rising spending is not.
  goodWhenUp: boolean;
};

const ChangeLine = ({ current, previous, goodWhenUp }: ChangeLineProps) => {
  const change =
    previous === undefined ? null : percentChange(current, previous);
  // No last-month figure to compare against: show nothing rather than a dash.
  if (change === null) {
    return null;
  }
  if (change === 0) {
    return (
      <LifeText variant="caption" color="text-life-muted">
        Same as last month
      </LifeText>
    );
  }
  const isGood = change > 0 === goodWhenUp;
  return (
    <LifeText
      variant="caption"
      color={isGood ? 'text-life-success' : 'text-life-danger'}
      className="font-semibold"
    >
      {change > 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
    </LifeText>
  );
};

const savingsCaption = (summary: FinanceSummary) => {
  if (summary.income === 0 && summary.expenses === 0) {
    return 'Add income and expenses to see your savings.';
  }
  if (summary.savings < 0) {
    return 'You spent more than you earned this month.';
  }
  if (summary.savingsRate === null) {
    return 'Add your income to see your savings rate.';
  }
  return `You kept ${summary.savingsRate}% of your income.`;
};

const SummaryCard = ({ summary, previousSummary }: SummaryCardProps) => (
  <View className="rounded-life-2xl border border-life-border bg-life-surface p-life-5">
    <LifeText
      variant="caption"
      color="text-life-muted"
      className="font-semibold"
    >
      SAVED THIS MONTH
    </LifeText>
    <LifeText
      variant="h1"
      color={summary.savings < 0 ? 'text-life-danger' : 'text-life-text'}
      className="pt-life-1 font-bold"
      adjustsFontSizeToFit
      numberOfLines={1}
    >
      {formatUzs(summary.savings)}
    </LifeText>
    <LifeText variant="bodySm" color="text-life-muted" className="pt-life-1">
      {savingsCaption(summary)}
    </LifeText>

    <View className="mt-life-4 flex-row gap-life-4 border-t border-life-border pt-life-4">
      <View className="flex-1 gap-life-1">
        <LifeText variant="caption" color="text-life-muted">
          INCOME
        </LifeText>
        <LifeText
          variant="body"
          color="text-life-success"
          className="font-bold"
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatUzs(summary.income)}
        </LifeText>
        <ChangeLine
          current={summary.income}
          previous={previousSummary?.income}
          goodWhenUp
        />
      </View>
      <View className="flex-1 gap-life-1">
        <LifeText variant="caption" color="text-life-muted">
          EXPENSES
        </LifeText>
        <LifeText
          variant="body"
          color="text-life-danger"
          className="font-bold"
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatUzs(summary.expenses)}
        </LifeText>
        <ChangeLine
          current={summary.expenses}
          previous={previousSummary?.expenses}
          goodWhenUp={false}
        />
      </View>
    </View>
  </View>
);

export default SummaryCard;
