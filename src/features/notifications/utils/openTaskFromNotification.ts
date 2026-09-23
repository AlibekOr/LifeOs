import { navigationRef } from '../../../app/navigation/navigationRef.ts';

type NotificationData = { [key: string]: string | number | object } | undefined;

// Opens the task a reminder was about. Called from notification presses in the
// foreground and while the app is alive in the background. A cold start is
// handled separately via getInitialNotification, once navigation exists.
export function openTaskFromNotification(data: NotificationData): void {
  const taskId = data?.taskId;
  if (typeof taskId !== 'string' || !navigationRef.isReady()) {
    return;
  }
  // initial: false keeps the Tasks list underneath the form.
  navigationRef.navigate('Tasks', {
    screen: 'TaskForm',
    params: { taskId },
    initial: false,
  });
}
