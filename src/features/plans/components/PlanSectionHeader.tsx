import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';

type PlanSectionHeaderProps = {
  label: string;
  // Set for a collapsible section (Past): the number of plans it holds.
  count?: number;
  expanded?: boolean;
  onToggle?: () => void;
};

const PlanSectionHeader = ({
  label,
  count,
  expanded = false,
  onToggle,
}: PlanSectionHeaderProps) => {
  if (!onToggle) {
    return (
      <View className="bg-life-bg pb-life-2 pt-life-4">
        <LifeText variant="h3" className="font-bold">
          {label}
        </LifeText>
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count ?? 0} plans`}
      accessibilityState={{ expanded }}
      onPress={onToggle}
      className="flex-row items-center justify-between bg-life-bg pb-life-2 pt-life-4"
    >
      <LifeText variant="h3" className="font-bold">
        {label}
      </LifeText>
      <View className="flex-row items-center gap-life-2">
        <LifeText variant="bodySm" color="text-life-muted">
          {count}
        </LifeText>
        <LifeIcon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#9494A1"
        />
      </View>
    </TouchableOpacity>
  );
};

export default PlanSectionHeader;
