import { useEffect, useMemo } from 'react';
import { notificationService } from '../../../services/notification.service.ts';
import { useForegroundCount } from '../../../hooks/useForegroundCount.ts';
import { planRangeFor, toDateString } from '../utils/planDates.ts';
import { usePlans } from './usePlans.ts';

// Keeps phone reminders in step with the plan list: on load, when plans change
// (including ones from another device or queued offline), and each time the app
// returns to the foreground.
export function usePlanReminderSync(): void {
  const foregroundCount = useForegroundCount();
  // Not usePlanRange: that uses useNow, which needs a screen, and this runs above
  // the navigator. The foreground count re-renders this hook, so the date is
  // read again whenever the app comes back. The range matches usePlanRange, so
  // it shares the same cached query.
  const today = toDateString(new Date());
  const range = useMemo(() => planRangeFor(today), [today]);
  const { plans } = usePlans(range);

  useEffect(() => {
    if (!plans) {
      return;
    }
    notificationService.syncPlanReminders(plans).catch(error => {
      console.error('[usePlanReminderSync] Failed to sync reminders', error);
    });
  }, [plans, foregroundCount]);
}
