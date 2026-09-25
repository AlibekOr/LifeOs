import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types.ts';

export type PlanFormScreenProps = NativeStackScreenProps<
  TasksStackParamList,
  'PlanForm'
>;
