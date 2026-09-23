import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types.ts';
import HomeScreen from '../../features/main/screens/HomeScreen.tsx';
import ComingSoonView from '../../features/main/components/ComingSoonView.tsx';
import LifeText from '../../shared/components/Typography/LifeText.tsx';
import TasksNavigator from './TasksNavigator.tsx';
import FinanceNavigator from './FinanceNavigator.tsx';
import ProfileScreen from '../../features/profile/screens/ProfileScreen.tsx';
import { usePendingSync } from '../../hooks/usePendingSync.ts';

const Tab = createBottomTabNavigator<MainTabParamList>();

const GoalsScreen = () => <ComingSoonView title="Goals" />;

const tabIcons: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Tasks: '📋',
  Goals: '🎯',
  Finance: '💰',
  Profile: '👤',
};

const MainNavigator = () => {
  usePendingSync();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9494A1',
        tabBarStyle: {
          backgroundColor: '#09090C',
          borderTopColor: '#2C2C35',
        },
        tabBarLabelStyle: { fontFamily: 'Inter', fontSize: 12 },
        tabBarIcon: () => (
          <LifeText variant="body">
            {tabIcons[route.name as keyof MainTabParamList]}
          </LifeText>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksNavigator} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Finance" component={FinanceNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
