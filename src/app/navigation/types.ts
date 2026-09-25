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
  Goals: NavigatorScreenParams<GoalsStackParamList> | undefined;
  Finance: NavigatorScreenParams<FinanceStackParamList> | undefined;
  Profile: undefined;
  // Reached from the Home bell; hidden from the tab bar.
  Notifications: undefined;
};

export type FinanceStackParamList = {
  FinanceOverview: undefined;
  // yearMonth ("YYYY-MM") tells the form which month's list holds the record.
  TransactionForm: { transactionId?: string; yearMonth?: string } | undefined;
};

export type GoalsStackParamList = {
  GoalsList: undefined;
  GoalDetail: { goalId: string };
  GoalForm: { goalId?: string } | undefined;
};

export type TasksListTab = 'tasks' | 'plans';

export type TasksStackParamList = {
  // `tab` opens the list on Tasks or Plans, e.g. from Home's "See all".
  TasksList: { tab?: TasksListTab } | undefined;
  TaskForm: { taskId?: string } | undefined;
  PlanForm: { planId?: string } | undefined;
};
