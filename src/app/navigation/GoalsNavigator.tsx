import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GoalsStackParamList } from './types.ts';
import { formScreenOptions } from './formScreenOptions.ts';
import GoalsListScreen from '../../features/goals/screens/GoalsListScreen.tsx';
import GoalDetailScreen from '../../features/goals/screens/GoalDetailScreen.tsx';
import GoalFormScreen from '../../features/goals/screens/GoalFormScreen.tsx';

const Stack = createNativeStackNavigator<GoalsStackParamList>();

const GoalsNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="GoalsList">
      <Stack.Screen
        name="GoalsList"
        component={GoalsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GoalDetail"
        component={GoalDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GoalForm"
        component={GoalFormScreen}
        options={formScreenOptions}
      />
    </Stack.Navigator>
  );
};

export default GoalsNavigator;
