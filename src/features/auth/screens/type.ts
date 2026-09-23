import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types.ts';

export type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;
export type ForgetPassScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'ForgotPassword'
>;

export type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Register'
>;

export type WelcomeScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'WelcomeAuth'
>;

export type OnboardingScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Onboarding'
>;
