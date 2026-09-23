import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FinanceStackParamList } from '../../../app/navigation/types.ts';

export type FinanceScreenProps = NativeStackScreenProps<
  FinanceStackParamList,
  'FinanceOverview'
>;

export type TransactionFormScreenProps = NativeStackScreenProps<
  FinanceStackParamList,
  'TransactionForm'
>;
