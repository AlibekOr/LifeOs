import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

// Shadow colour is life.primary; native shadow props cannot be expressed as classes.
const styles = StyleSheet.create({
  primaryShadow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
});

type LifeButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ImageSourcePropType;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary';
  // Replaces the default width classes, e.g. "flex-1" for side-by-side buttons.
  widthClassName?: string;
  accessibilityLabel?: string;
};

const variantClassName = {
  primary: { enabled: 'bg-life-primary', disabled: 'bg-life-subtle' },
  secondary: {
    enabled: 'border border-life-border bg-life-surface',
    disabled: 'border border-life-border bg-life-surface opacity-50',
  },
};

const LifeButton = ({
  title,
  onPress,
  disabled = false,
  icon,
  fullWidth = false,
  variant = 'primary',
  widthClassName,
  accessibilityLabel,
}: LifeButtonProps) => {
  const width =
    widthClassName ?? (fullWidth ? 'w-full' : 'w-full max-w-[362px]');
  const colors = variantClassName[variant];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      className={`h-[52px] ${width} flex-row gap-2 items-center justify-center rounded-life-lg ${
        disabled ? colors.disabled : colors.enabled
      }`}
      style={
        disabled || variant === 'secondary' ? undefined : styles.primaryShadow
      }
    >
      {icon && <Image source={icon} className={'h-7 w-7'} />}
      <Text className={'font-inter text-[16px] font-semibold text-life-text'}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
export default LifeButton;
