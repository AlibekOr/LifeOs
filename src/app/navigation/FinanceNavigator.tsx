import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FinanceStackParamList } from './types.ts';
import FinanceScreen from '../../features/finance/screens/FinanceScreen.tsx';
import TransactionFormScreen from '../../features/finance/screens/TransactionFormScreen.tsx';

const Stack = createNativeStackNavigator<FinanceStackParamList>();

const FinanceNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="FinanceOverview">
      <Stack.Screen
        name="FinanceOverview"
        component={FinanceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransactionForm"
        component={TransactionFormScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default FinanceNavigator;
