import { Image, Text, TouchableOpacity } from 'react-native';
type LifeButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: any;
  fullWidth?: boolean;
};
const LifeButton = ({
  title,
  onPress,
  disabled = false,
  icon,
  fullWidth = false,
}: LifeButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`h-[52px] ${
        fullWidth ? 'w-full' : 'w-[362px]'
      } flex-row gap-2 items-center justify-center rounded-life-lg ${
        disabled ? 'bg-life-subtle' : 'bg-life-primary'
      }`}
      style={
        disabled
          ? undefined
          : {
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2,
            }
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
