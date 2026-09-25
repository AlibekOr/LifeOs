import { navigationRef } from '../../../app/navigation/navigationRef.ts';
import { openTaskFromNotification } from './openTaskFromNotification.ts';

type NotificationData = Parameters<typeof openTaskFromNotification>[0];

// Opens what a reminder was about, whether it was a plan or a task.
export function openFromNotification(data: NotificationData): void {
  const planId = data?.planId;
  if (typeof planId !== 'string') {
    openTaskFromNotification(data);
    return;
  }
  if (!navigationRef.isReady()) {
    return;
  }
  // initial: false keeps the Tasks list underneath the form.
  navigationRef.navigate('Tasks', {
    screen: 'PlanForm',
    params: { planId },
    initial: false,
  });
}
