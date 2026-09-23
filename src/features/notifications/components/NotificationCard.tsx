import { TouchableOpacity, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import type { NotificationTone } from '../utils/buildNotifications.ts';
import type { NotificationItem } from '../hooks/useNotifications.ts';

type NotificationCardProps = {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
};

// Icon colors are hex because SVG paint props cannot take Tailwind classes;
// each matches its LifeOS token.
const tones: Record<
  NotificationTone,
  { tile: string; border: string; icon: string }
> = {
  danger: {
    tile: 'bg-life-danger/10',
    border: 'border-life-danger/30',
    icon: '#EF4444',
  },
  primary: {
    tile: 'bg-life-primary/10',
    border: 'border-life-primary/30',
    icon: '#818CF8',
  },
  warning: {
    tile: 'bg-life-warning/10',
    border: 'border-life-warning/30',
    icon: '#F59E0B',
  },
  success: {
    tile: 'bg-life-success/10',
    border: 'border-life-success/30',
    icon: '#22C55E',
  },
};

const NotificationCard = ({ item, onPress }: NotificationCardProps) => {
  const tone = tones[item.tone];
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${item.unread ? 'Unread. ' : ''}${item.title}. ${
        item.body
      }`}
      onPress={() => onPress(item)}
      className={`flex-row gap-life-3 rounded-life-lg border bg-life-surface p-life-4 ${
        item.unread ? tone.border : 'border-life-border'
      }`}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-life-md ${tone.tile}`}
      >
        <LifeIcon name={item.icon} size={20} color={tone.icon} />
      </View>
      <View className="flex-1 gap-life-1">
        <LifeText
          variant="bodySm"
          className={item.unread ? 'font-bold' : 'font-medium'}
        >
          {item.title}
        </LifeText>
        <LifeText variant="bodySm" color="text-life-muted">
          {item.body}
        </LifeText>
        <LifeText variant="caption" color="text-life-subtle">
          {item.timeLabel}
        </LifeText>
      </View>
      {item.unread ? (
        <View
          accessibilityElementsHidden
          className="mt-life-1 h-2 w-2 rounded-full bg-life-primary"
        />
      ) : null}
    </TouchableOpacity>
  );
};

export default NotificationCard;
