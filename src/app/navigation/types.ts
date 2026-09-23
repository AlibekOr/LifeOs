import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  WelcomeAuth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: NavigatorScreenParams<TasksStackParamList> | undefined;
  Goals: undefined;
  Finance: undefined;
  Profile: undefined;
  // Reached from the Home bell; hidden from the tab bar.
  Notifications: undefined;
};

export type FinanceStackParamList = {
  FinanceOverview: undefined;
  // yearMonth ("YYYY-MM") tells the form which month's list holds the record.
  TransactionForm: { transactionId?: string; yearMonth?: string } | undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskForm: { taskId?: string } | undefined;
};
