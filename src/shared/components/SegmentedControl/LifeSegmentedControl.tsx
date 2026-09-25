import { TouchableOpacity, View } from 'react-native';
import LifeText from '../Typography/LifeText.tsx';

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type LifeSegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Two or three exclusive views of the same screen (e.g. Tasks | Plans). Unlike
// LifePills these are tabs, so screen readers announce them as such.
function LifeSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: LifeSegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row rounded-life-md border border-life-border bg-life-surface p-life-1"
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center rounded-life-sm py-life-2 ${
              selected ? 'bg-life-primary' : ''
            }`}
          >
            <LifeText
              variant="bodySm"
              className="font-semibold"
              color={selected ? 'text-life-text' : 'text-life-muted'}
            >
              {option.label}
            </LifeText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default LifeSegmentedControl;
