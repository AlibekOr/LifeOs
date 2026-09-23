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
  Notifications: undefined;
  WelcomeAuth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Goals: undefined;
  Finance: undefined;
  Profile: undefined;
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
