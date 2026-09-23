import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types.ts';

export type TasksListScreenProps = NativeStackScreenProps<
  TasksStackParamList,
  'TasksList'
>;

export type TaskFormScreenProps = NativeStackScreenProps<
  TasksStackParamList,
  'TaskForm'
>;
