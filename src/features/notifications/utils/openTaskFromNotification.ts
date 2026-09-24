import { navigationRef } from '../../../app/navigation/navigationRef.ts';

type NotificationData = { [key: string]: string | number | object } | undefined;

// Opens what a reminder was about. Called from notification presses in the
// foreground and while the app is alive in the background. A cold start is
// handled separately via getInitialNotification, once navigation exists.
export function openTaskFromNotification(data: NotificationData): void {
  const taskId = data?.taskId;
  if (typeof taskId !== 'string' || !navigationRef.isReady()) {
    return;
  }
  // "Started" and "time is up" alerts are about acting on the task right now:
  // Home has the Now card with Start, Complete and +15 min.
  if (data?.kind === 'start' || data?.kind === 'end') {
    navigationRef.navigate('Home');
    return;
  }
  // initial: false keeps the Tasks list underneath the form.
  navigationRef.navigate('Tasks', {
    screen: 'TaskForm',
    params: { taskId },
    initial: false,
  });
}
