import { Image, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import type { SpendingInsight } from '../utils/financeSummary.ts';

const sparkleIcon = require('../../../shared/assets/notifications/sparkles.png');

type InsightCardProps = {
  insight: SpendingInsight;
  previousMonthName: string;
};

const InsightCard = ({ insight, previousMonthName }: InsightCardProps) => {
  const advice =
    insight.direction === 'more'
      ? 'Keep an eye on it to stay within budget.'
      : 'Nice work keeping it down.';

  return (
    <View className="flex-row gap-life-3 rounded-life-lg border border-life-warning/30 bg-life-warning/10 p-life-4">
      <Image source={sparkleIcon} className="mt-life-1 h-4 w-4" />
      <LifeText variant="bodySm" className="flex-1">
        You spent {insight.percentChange}% {insight.direction} on{' '}
        {insight.category.toLowerCase()} this month compared to{' '}
        {previousMonthName}. {advice}
      </LifeText>
    </View>
  );
};

export default InsightCard;
