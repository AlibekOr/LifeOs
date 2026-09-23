import type { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';

type LifeFabProps = {
  accessibilityLabel: string;
  onPress: () => void;
  // Defaults to a plus icon.
  icon?: ReactNode;
};

// Floating "add" button pinned to the bottom-right of the nearest positioned
// parent (a screen's root view). Screens must leave enough bottom padding in
// their scrollable content so the last row can scroll clear of it.
const LifeFab = ({ accessibilityLabel, onPress, icon }: LifeFabProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    activeOpacity={0.85}
    onPress={onPress}
    className="absolute bottom-life-5 right-life-5 h-14 w-14 items-center justify-center rounded-full bg-life-primary"
  >
    {icon ?? <LifeIcon name="plus" size={28} strokeWidth={2.5} />}
  </TouchableOpacity>
);

export default LifeFab;
