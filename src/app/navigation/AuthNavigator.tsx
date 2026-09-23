import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types.ts';
import LoginScreen from '../../features/auth/screens/LoginScreen.tsx';
import ForgotPasswordScreen from '../../features/auth/screens/ForgotPasswordScreen.tsx';
import RegisterScreen from '../../features/auth/screens/RegisterScreen.tsx';
import WelcomeAuth from '../../features/auth/screens/WelcomeAuth.tsx';
import OnboardingScreen from '../../features/auth/screens/OnboardingScreen.tsx';
const Stack = createNativeStackNavigator<AuthStackParamList>();
const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName={'Onboarding'}>
      <Stack.Screen
        name={'Onboarding'}
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={'WelcomeAuth'}
        component={WelcomeAuth}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={'Login'}
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={'Register'}
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={'ForgotPassword'}
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
