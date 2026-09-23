import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import {
  currentYearMonth,
  formatYearMonth,
  shiftYearMonth,
} from '../utils/month.ts';

type MonthNavigatorProps = {
  yearMonth: string;
  onChange: (yearMonth: string) => void;
  onPressLabel: () => void;
};

const MonthNavigator = ({
  yearMonth,
  onChange,
  onPressLabel,
}: MonthNavigatorProps) => {
  // Future months hold no data, so stepping past the current month is disabled.
  const canGoNext = yearMonth < currentYearMonth();
  const label = formatYearMonth(yearMonth);

  return (
    <View className="flex-row items-center justify-between rounded-full border border-life-border bg-life-surface p-life-1">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        onPress={() => onChange(shiftYearMonth(yearMonth, -1))}
        className="h-10 w-10 items-center justify-center rounded-full"
      >
        <LifeText variant="body" color="text-life-accent" className="font-bold">
          ◀
        </LifeText>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}. Choose month`}
        onPress={onPressLabel}
        className="flex-1 items-center py-life-2"
      >
        <LifeText variant="body" className="font-semibold">
          {label}
        </LifeText>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityState={{ disabled: !canGoNext }}
        disabled={!canGoNext}
        onPress={() => onChange(shiftYearMonth(yearMonth, 1))}
        className={`h-10 w-10 items-center justify-center rounded-full ${
          canGoNext ? '' : 'opacity-30'
        }`}
      >
        <LifeText variant="body" color="text-life-accent" className="font-bold">
          ▶
        </LifeText>
      </TouchableOpacity>
    </View>
  );
};

export default MonthNavigator;
