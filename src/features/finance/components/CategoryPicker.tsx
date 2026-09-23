import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import type { TransactionCategory } from '../../../types/transaction.types.ts';
import { categoryEmoji } from '../utils/categories.ts';

type CategoryPickerProps<T extends TransactionCategory> = {
  categories: T[];
  value: T;
  onChange: (category: T) => void;
};

function CategoryPicker<T extends TransactionCategory>({
  categories,
  value,
  onChange,
}: CategoryPickerProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-life-2">
      {categories.map(category => {
        const selected = category === value;
        return (
          <TouchableOpacity
            key={category}
            accessibilityRole="button"
            accessibilityLabel={category}
            accessibilityState={{ selected }}
            onPress={() => onChange(category)}
            className={`w-[31.5%] items-center gap-life-1 rounded-life-lg border py-life-3 ${
              selected
                ? 'border-life-primary bg-life-primary/15'
                : 'border-life-border bg-life-surface'
            }`}
          >
            <LifeText variant="h2">{categoryEmoji[category]}</LifeText>
            <LifeText
              variant="caption"
              color={selected ? 'text-life-text' : 'text-life-muted'}
              className="font-semibold"
            >
              {category}
            </LifeText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default CategoryPicker;
