import { TouchableOpacity, View } from 'react-native';
import LifeText from '../Typography/LifeText.tsx';

type LifePillsProps<T extends string> = {
  options: T[];
  value: T;
  onChange: (value: T) => void;
};

function LifePills<T extends string>({
  options,
  value,
  onChange,
}: LifePillsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-life-2">
      {options.map(option => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            className={`rounded-full border px-life-3 py-life-2 ${
              active
                ? 'border-life-primary bg-life-primary'
                : 'border-life-border bg-life-surface'
            }`}
          >
            <LifeText
              variant="bodySm"
              className="font-semibold"
              color={active ? 'text-life-text' : 'text-life-muted'}
            >
              {option}
            </LifeText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default LifePills;
