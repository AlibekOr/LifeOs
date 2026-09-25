import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifePills from '../../../shared/components/Pills/LifePills.tsx';
import LifeDateTimeField from '../../../shared/components/DateTimeField/LifeDateTimeField.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import { timeFromString, timeToString } from '../../../utils/timeOfDay.ts';
import {
  DEFAULT_WORK_START_TIME,
  WORK_START_PRESETS,
} from '../../../utils/workStart.ts';
import { useProfile, useUpdateProfile } from '../hooks/useProfile.ts';

const CUSTOM = 'Custom';
const PRESET_LABELS: string[] = WORK_START_PRESETS.map(time =>
  time.slice(0, 5),
);
const OPTIONS = [...PRESET_LABELS, CUSTOM];
// The picker reports every step while it is dragged; save once it settles.
const SAVE_DELAY_MS = 600;

const WorkStartCard = () => {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  // The time being saved, shown until the server has confirmed it.
  const [draft, setDraft] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    },
    [],
  );

  const value = draft ?? profile?.work_start_time ?? DEFAULT_WORK_START_TIME;
  const label = value.slice(0, 5);
  const showCustom = customOpen || !PRESET_LABELS.includes(label);
  const selected = showCustom ? CUSTOM : label;

  const save = (time: string) => {
    setDraft(time);
    updateProfile.mutate(
      { work_start_time: time },
      {
        onError: error => {
          console.error('[WorkStartCard] Failed to save', error);
          Alert.alert('Could not save your work start time. Please try again.');
        },
        onSettled: () => setDraft(null),
      },
    );
  };

  const cancelPendingSave = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  };

  const handleOption = (option: string) => {
    cancelPendingSave();
    if (option === CUSTOM) {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    save(`${option}:00`);
  };

  const handleCustomTime = (date: Date) => {
    const time = timeToString(date);
    setDraft(time);
    cancelPendingSave();
    saveTimer.current = setTimeout(() => save(time), SAVE_DELAY_MS);
  };

  return (
    <View className="gap-life-3 rounded-life-2xl border border-life-border bg-life-surface p-life-5">
      <View className="flex-row items-center gap-life-2">
        <LifeIcon name="clock" size={18} color="#818CF8" />
        <LifeText variant="body" className="font-semibold">
          Work starts at
        </LifeText>
      </View>
      <LifeText variant="bodySm" color="text-life-muted">
        {`Your working day starts at ${label}. New tasks and plans start then, and reminders for all-day plans default to this time.`}
      </LifeText>
      <LifePills options={OPTIONS} value={selected} onChange={handleOption} />
      {showCustom ? (
        <LifeDateTimeField
          label="Custom time"
          mode="time"
          value={timeFromString(value)}
          onChange={handleCustomTime}
        />
      ) : null}
    </View>
  );
};

export default WorkStartCard;
