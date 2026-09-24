import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import type { MainTabParamList } from './types.ts';
import HomeScreen from '../../features/main/screens/HomeScreen.tsx';
import ComingSoonView from '../../features/main/components/ComingSoonView.tsx';
import LifeIcon from '../../assets/icons/LifeIcon.tsx';
import type { LifeIconName } from '../../assets/icons/LifeIcon.tsx';
import TasksNavigator from './TasksNavigator.tsx';
import FinanceNavigator from './FinanceNavigator.tsx';
import ProfileScreen from '../../features/profile/screens/ProfileScreen.tsx';
import NotificationsScreen from '../../features/notifications/screens/NotificationsScreen.tsx';
import { usePendingSync } from '../../hooks/usePendingSync.ts';
import { useReminderSync } from '../../features/tasks/hooks/useReminderSync.ts';
import { useNotificationTaps } from '../../features/notifications/hooks/useNotificationTaps.ts';

const Tab = createBottomTabNavigator<MainTabParamList>();

const GoalsScreen = () => <ComingSoonView title="Goals" />;

const tabIcons: Record<keyof MainTabParamList, LifeIconName> = {
  Home: 'home',
  Tasks: 'list-checks',
  Goals: 'target',
  Finance: 'wallet',
  Profile: 'user',
  Notifications: 'bell',
};

// Defined at module level so the tabBarIcon component is not recreated on every
// MainNavigator render, which would remount the icons.
const screenOptions = ({
  route,
}: {
  route: RouteProp<MainTabParamList>;
}): BottomTabNavigationOptions => ({
  headerShown: false,
  tabBarActiveTintColor: '#6366F1',
  tabBarInactiveTintColor: '#9494A1',
  tabBarStyle: {
    backgroundColor: '#09090C',
    borderTopColor: '#2C2C35',
  },
  tabBarLabelStyle: { fontFamily: 'Inter', fontSize: 12 },
  // `color` is tabBarActiveTintColor (life.primary) or the inactive one
  // (life.muted), so icon and label always match.
  tabBarIcon: ({ color, size }) => (
    <LifeIcon name={tabIcons[route.name]} color={color} size={size} />
  ),
});

const MainNavigator = () => {
  usePendingSync();
  useReminderSync();
  useNotificationTaps();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksNavigator} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Finance" component={FinanceNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        // Not a tab: opened from the Home bell. Both options are needed to hide
        // the button without leaving a gap in the tab bar.
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
