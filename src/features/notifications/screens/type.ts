import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../../app/navigation/types.ts';

export type NotificationsScreenProps = BottomTabScreenProps<
  MainTabParamList,
  'Notifications'
>;
