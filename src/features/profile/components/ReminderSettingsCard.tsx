import { View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifePills from '../../../shared/components/Pills/LifePills.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import { notificationService } from '../../../services/notification.service.ts';
import {
  REMINDER_OPTIONS,
  useReminderSettingsStore,
} from '../../../store/reminderSettings.store.ts';
import type { ReminderLeadMinutes } from '../../../store/reminderSettings.store.ts';

const LABELS = REMINDER_OPTIONS.map(option => option.label);

function describe(leadMinutes: ReminderLeadMinutes): string {
  if (leadMinutes === null) {
    return "Reminders are off. You won't be notified about upcoming tasks.";
  }
  if (leadMinutes === 0) {
    return "You'll be notified when a task starts.";
  }
  return `You'll be notified ${leadMinutes} min before each task starts.`;
}

const ReminderSettingsCard = () => {
  const leadMinutes = useReminderSettingsStore(state => state.leadMinutes);
  const setLeadMinutes = useReminderSettingsStore(
    state => state.setLeadMinutes,
  );

  const selectedLabel =
    REMINDER_OPTIONS.find(option => option.value === leadMinutes)?.label ??
    LABELS[0];

  const handleChange = (label: string) => {
    const option = REMINDER_OPTIONS.find(item => item.label === label);
    if (!option) {
      return;
    }
    setLeadMinutes(option.value);
    if (option.value !== null) {
      // Asked when the user turns reminders on, not at app launch.
      notificationService.requestReminderPermission().catch(error => {
        console.error('[ReminderSettings] Permission request failed', error);
      });
    }
  };

  return (
    <View className="gap-life-3 rounded-life-2xl border border-life-border bg-life-surface p-life-5">
      <View className="flex-row items-center gap-life-2">
        <LifeIcon name="bell" size={18} color="#818CF8" />
        <LifeText variant="body" className="font-semibold">
          Task reminders
        </LifeText>
      </View>
      <LifeText variant="bodySm" color="text-life-muted">
        {describe(leadMinutes)}
      </LifeText>
      <LifePills
        options={LABELS}
        value={selectedLabel}
        onChange={handleChange}
      />
    </View>
  );
};

export default ReminderSettingsCard;
