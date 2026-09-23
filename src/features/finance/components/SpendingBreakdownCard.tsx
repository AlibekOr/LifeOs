import { View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import type { CategoryTotal } from '../utils/financeSummary.ts';
import { categoryBarClassNames, categoryEmoji } from '../utils/categories.ts';
import { formatUzs } from '../utils/formatMoney.ts';

type SpendingBreakdownCardProps = {
  categories: CategoryTotal[];
  // What the percentages are a share of, e.g. "spending" or "income".
  noun: string;
  topLabel: string;
};

// One compact card: a proportional bar for the whole month plus one row per
// category, largest first. Used for both spending and income.
const SpendingBreakdownCard = ({
  categories,
  noun,
  topLabel,
}: SpendingBreakdownCardProps) => {
  if (categories.length === 0) {
    return null;
  }
  // With a single category "biggest" says nothing, so the badge stays hidden.
  const showTopBadge = categories.length > 1;

  return (
    <View className="gap-life-4 rounded-life-2xl border border-life-border bg-life-surface p-life-4">
      <View
        accessibilityLabel={`Spending split: ${categories
          .map(item => `${item.category} ${item.percent}%`)
          .join(', ')}`}
        className="h-2 w-full flex-row gap-life-1 overflow-hidden rounded-full"
      >
        {categories.map(item => (
          <View
            key={item.category}
            className={`h-full rounded-full ${
              categoryBarClassNames[item.category]
            }`}
            style={{ flex: item.amount }}
          />
        ))}
      </View>

      <View className="gap-life-3">
        {categories.map((item, index) => (
          <View
            key={item.category}
            accessible
            accessibilityLabel={`${item.category}: ${formatUzs(item.amount)}, ${
              item.percent
            }% of ${noun}`}
            className="flex-row items-center gap-life-3"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-life-bg">
              <LifeText variant="bodySm">
                {categoryEmoji[item.category]}
              </LifeText>
            </View>
            <View className="flex-1 gap-life-1">
              <View className="flex-row items-center gap-life-2">
                <View
                  className={`h-2 w-2 rounded-full ${
                    categoryBarClassNames[item.category]
                  }`}
                />
                <LifeText variant="bodySm" className="font-semibold">
                  {item.category}
                </LifeText>
                {showTopBadge && index === 0 ? (
                  <View className="rounded-full bg-life-primary/15 px-life-2 py-life-1">
                    <LifeText
                      variant="caption"
                      color="text-life-accent"
                      className="font-semibold"
                    >
                      {topLabel}
                    </LifeText>
                  </View>
                ) : null}
              </View>
              <LifeText variant="caption" color="text-life-muted">
                {item.percent}% of {noun}
              </LifeText>
            </View>
            <LifeText variant="bodySm" className="font-semibold">
              {formatUzs(item.amount)}
            </LifeText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default SpendingBreakdownCard;
