import { TouchableOpacity } from 'react-native';
import LifeText from '../Typography/LifeText.tsx';

type LifeFabProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

// Floating "add" button pinned to the bottom-right of the nearest positioned
// parent (a screen's root view). Screens must leave enough bottom padding in
// their scrollable content so the last row can scroll clear of it.
const LifeFab = ({ accessibilityLabel, onPress }: LifeFabProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    activeOpacity={0.85}
    onPress={onPress}
    className="absolute bottom-life-5 right-life-5 h-14 w-14 items-center justify-center rounded-full bg-life-primary"
  >
    <LifeText variant="h2" className="font-bold">
      +
    </LifeText>
  </TouchableOpacity>
);

export default LifeFab;
