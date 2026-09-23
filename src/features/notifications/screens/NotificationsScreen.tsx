import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import NotificationCard from '../components/NotificationCard.tsx';
import { useNotifications } from '../hooks/useNotifications.ts';
import type { NotificationItem } from '../hooks/useNotifications.ts';
import type { NotificationGroup } from '../utils/buildNotifications.ts';
import type { NotificationsScreenProps } from './type.ts';

const GROUPS: { key: NotificationGroup; title: string }[] = [
  { key: 'attention', title: 'NEEDS ATTENTION' },
  { key: 'upcoming', title: 'COMING UP' },
  { key: 'insights', title: 'INSIGHTS' },
];

const NotificationsScreen = ({ navigation }: NotificationsScreenProps) => {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications();

  const handlePress = (item: NotificationItem) => {
    markRead(item.id);
    switch (item.target.type) {
      case 'task':
        // initial: false keeps the Tasks list underneath the form.
        navigation.navigate('Tasks', {
          screen: 'TaskForm',
          params: { taskId: item.target.taskId },
          initial: false,
        });
        break;
      case 'tasks':
        navigation.navigate('Tasks');
        break;
      case 'finance':
        navigation.navigate('Finance');
        break;
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="items-center py-life-10">
          <ActivityIndicator color="#6366F1" />
        </View>
      );
    }
    if (notifications.length === 0) {
      return (
        <View className="items-center gap-life-3 rounded-life-2xl border border-life-border bg-life-surface p-life-6">
          <LifeIcon name="circle-check" size={40} color="#22C55E" />
          <LifeText variant="h3" className="font-bold">
            You're all caught up
          </LifeText>
          <LifeText
            variant="bodySm"
            color="text-life-muted"
            className="text-center"
          >
            Alerts about your tasks and spending will show up here.
          </LifeText>
        </View>
      );
    }
    return GROUPS.map(group => {
      const items = notifications.filter(item => item.group === group.key);
      if (items.length === 0) {
        return null;
      }
      return (
        <View key={group.key} className="gap-life-3">
          <LifeText
            variant="bodySm"
            color="text-life-muted"
            className="font-semibold"
          >
            {group.title}
          </LifeText>
          {items.map(item => (
            <NotificationCard key={item.id} item={item} onPress={handlePress} />
          ))}
        </View>
      );
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <View className="flex-row items-center justify-between px-life-5 pb-life-3 pt-life-3">
        <View className="flex-row items-center gap-life-2">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.goBack()}
          >
            <LifeIcon name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <LifeText variant="h2" className="font-bold">
            Notifications
          </LifeText>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: unreadCount === 0 }}
          disabled={unreadCount === 0}
          onPress={markAllRead}
          className={unreadCount === 0 ? 'opacity-40' : ''}
        >
          <LifeText
            variant="bodySm"
            color="text-life-accent"
            className="font-semibold"
          >
            Mark all read
          </LifeText>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-life-5 px-life-5 pb-life-10 pt-life-2"
        showsVerticalScrollIndicator={false}
      >
        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
