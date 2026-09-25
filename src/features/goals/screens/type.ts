import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GoalsStackParamList } from '../../../app/navigation/types.ts';

export type GoalsListScreenProps = NativeStackScreenProps<
  GoalsStackParamList,
  'GoalsList'
>;

export type GoalDetailScreenProps = NativeStackScreenProps<
  GoalsStackParamList,
  'GoalDetail'
>;

export type GoalFormScreenProps = NativeStackScreenProps<
  GoalsStackParamList,
  'GoalForm'
>;
