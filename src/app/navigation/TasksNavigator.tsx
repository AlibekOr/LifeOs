import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TasksStackParamList } from './types.ts';
import TasksListScreen from '../../features/tasks/screens/TasksListScreen.tsx';
import TaskFormScreen from '../../features/tasks/screens/TaskFormScreen.tsx';
import PlanFormScreen from '../../features/plans/screens/PlanFormScreen.tsx';

const Stack = createNativeStackNavigator<TasksStackParamList>();

const TasksNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="TasksList">
      <Stack.Screen
        name="TasksList"
        component={TasksListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="PlanForm"
        component={PlanFormScreen}
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
};

export default TasksNavigator;
