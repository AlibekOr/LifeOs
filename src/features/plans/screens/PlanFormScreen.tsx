import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeInput from '../../../shared/components/Input/LifeInput.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import LifePills from '../../../shared/components/Pills/LifePills.tsx';
import LifeDateTimeField from '../../../shared/components/DateTimeField/LifeDateTimeField.tsx';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus.ts';
import { PlanOverlapError } from '../../../services/plan.service.ts';
import {
  useCreatePlan,
  useDeletePlan,
  usePlans,
  useUpdatePlan,
} from '../hooks/usePlans.ts';
import { usePlanRange } from '../hooks/usePlanRange.ts';
import { addDays, toDateString } from '../utils/planDates.ts';
import {
  LOCATION_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  TIMED_REMINDER_OPTIONS,
  TITLE_MAX_LENGTH,
  addMinutesToTime,
  buildPlanInput,
  dateFromString,
  defaultPlanFormValues,
  effectiveEndDate,
  planToFormValues,
  timeFromString,
  timeToString,
  validatePlanForm,
  withMultiDay,
  withPlanDate,
  type PlanFormValues,
} from '../utils/planForm.ts';
import { formatDayShort, formatPlanTimeSpan } from '../utils/planFormatting.ts';
import { findOverlappingPlan } from '../utils/planOverlap.ts';
import type { PlanFormScreenProps } from './type.ts';

type DateChoice = 'Today' | 'Tomorrow' | 'Pick date';
type DurationOption = 'One day' | 'Multiple days';
type TimeOption = 'All day' | 'At time';
type EndTimeOption = 'No end time' | 'Set end time';
type AllDayReminderOption = 'None' | 'At a set time';

const DATE_CHOICES: DateChoice[] = ['Today', 'Tomorrow', 'Pick date'];
const DURATION_OPTIONS: DurationOption[] = ['One day', 'Multiple days'];
const TIME_OPTIONS: TimeOption[] = ['All day', 'At time'];
const END_TIME_OPTIONS: EndTimeOption[] = ['No end time', 'Set end time'];
const ALL_DAY_REMINDER_OPTIONS: AllDayReminderOption[] = [
  'None',
  'At a set time',
];

const PlanFormScreen = ({ navigation, route }: PlanFormScreenProps) => {
  const planId = route.params?.planId;
  const isEdit = Boolean(planId);

  const range = usePlanRange();
  const { plans, isLoading } = usePlans(range);
  const { isOnline } = useNetworkStatus();
  const existingPlan = planId
    ? plans?.find(plan => plan.id === planId)
    : undefined;

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [today] = useState(() => toDateString(new Date()));
  const tomorrow = addDays(today, 1);
  const [values, setValues] = useState<PlanFormValues>(() =>
    defaultPlanFormValues(new Date()),
  );
  const [titleTouched, setTitleTouched] = useState(false);
  const [customDate, setCustomDate] = useState(false);
  const [saving, setSaving] = useState(false);
  // Populate once per plan so a background refetch or sync never overwrites
  // what the user is typing.
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  useEffect(() => {
    if (existingPlan && existingPlan.id !== hydratedId) {
      const next = planToFormValues(existingPlan);
      setHydratedId(existingPlan.id);
      setValues(next);
      setCustomDate(next.planDate !== today && next.planDate !== tomorrow);
    }
  }, [existingPlan, hydratedId, today, tomorrow]);

  const errors = validatePlanForm(values);
  const input = useMemo(() => buildPlanInput(values), [values]);
  const overlap = useMemo(
    () =>
      errors.endDate || errors.endTime
        ? undefined
        : findOverlappingPlan(
            {
              id: planId,
              plan_date: input.plan_date,
              end_date: input.end_date ?? null,
              plan_time: input.plan_time ?? null,
              plan_end_time: input.plan_end_time ?? null,
              status: existingPlan?.status ?? 'planned',
            },
            plans ?? [],
          ),
    [errors.endDate, errors.endTime, input, planId, existingPlan, plans],
  );
  const isValid = Object.keys(errors).length === 0 && !overlap;

  const dateChoice: DateChoice = customDate
    ? 'Pick date'
    : values.planDate === today
    ? 'Today'
    : values.planDate === tomorrow
    ? 'Tomorrow'
    : 'Pick date';

  const update = (patch: Partial<PlanFormValues>) =>
    setValues(previous => ({ ...previous, ...patch }));

  const handleDateChoice = (choice: DateChoice) => {
    if (choice === 'Pick date') {
      setCustomDate(true);
      return;
    }
    setCustomDate(false);
    setValues(previous =>
      withPlanDate(previous, choice === 'Today' ? today : tomorrow),
    );
  };

  const handleStartTime = (date: Date) => {
    setValues(previous => {
      const startTime = timeToString(date);
      // Keep the end after the start when both are on the same day.
      const shiftEnd =
        previous.hasEndTime &&
        !effectiveEndDate(previous) &&
        previous.endTime <= startTime;
      return {
        ...previous,
        startTime,
        endTime: shiftEnd ? addMinutesToTime(startTime, 60) : previous.endTime,
      };
    });
  };

  const handleSubmit = async () => {
    setTitleTouched(true);
    if (!isValid || saving) {
      return;
    }
    setSaving(true);
    try {
      if (isEdit && planId) {
        await updatePlan.mutateAsync({ id: planId, input });
      } else {
        await createPlan.mutateAsync(input);
      }
      navigation.goBack();
    } catch (err) {
      console.error('[PlanForm] Failed to save plan', err);
      if (err instanceof PlanOverlapError) {
        Alert.alert('Time already taken', err.message);
      } else {
        Alert.alert('Could not save plan', 'Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!planId) {
      return;
    }
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        'Deleting a plan needs a connection. Please try again when you reconnect.',
      );
      return;
    }
    Alert.alert('Delete plan?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlan.mutateAsync(planId);
            navigation.goBack();
          } catch (err) {
            console.error('[PlanForm] Failed to delete plan', err);
            Alert.alert('Could not delete plan', 'Please try again.');
          }
        },
      },
    ]);
  };

  const header = (
    <View className="h-12 flex-row items-center justify-between px-life-4">
      <TouchableOpacity
        accessibilityLabel="Cancel"
        onPress={() => navigation.goBack()}
      >
        <LifeText variant="body" className="text-life-accent">
          Cancel
        </LifeText>
      </TouchableOpacity>
      <LifeText variant="h3" className="font-bold">
        {isEdit ? 'Edit Plan' : 'New Plan'}
      </LifeText>
      <View className="w-14" />
    </View>
  );

  if (isEdit && !existingPlan) {
    return (
      <SafeAreaView className="flex-1 bg-life-bg" edges={['top', 'bottom']}>
        {header}
        <View className="flex-1 items-center justify-center px-life-5">
          {isLoading ? (
            <ActivityIndicator color="#6366F1" />
          ) : (
            <LifeText variant="bodySm" color="text-life-muted">
              This plan could not be found.
            </LifeText>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top', 'bottom']}>
      {header}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-life-5 px-life-5 pb-life-10 pt-life-3"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LifeInput
            label="Title"
            placeholder="What are you planning?"
            value={values.title}
            maxLength={TITLE_MAX_LENGTH}
            onChangeText={title => update({ title })}
            onBlur={() => setTitleTouched(true)}
            error={titleTouched ? errors.title : undefined}
          />

          <LifeInput
            label="Location (optional)"
            placeholder="e.g. Fitness Club, Nukus"
            value={values.location}
            maxLength={LOCATION_MAX_LENGTH}
            onChangeText={location => update({ location })}
          />

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Date
            </LifeText>
            <LifePills
              options={DATE_CHOICES}
              value={dateChoice}
              onChange={handleDateChoice}
            />
            {dateChoice === 'Pick date' && (
              <LifeDateTimeField
                label="Start date"
                mode="date"
                value={dateFromString(values.planDate)}
                onChange={date =>
                  setValues(previous =>
                    withPlanDate(previous, toDateString(date)),
                  )
                }
              />
            )}
          </View>

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Duration
            </LifeText>
            <LifePills
              options={DURATION_OPTIONS}
              value={values.multiDay ? 'Multiple days' : 'One day'}
              onChange={option =>
                setValues(previous =>
                  withMultiDay(previous, option === 'Multiple days'),
                )
              }
            />
            {values.multiDay && (
              <LifeDateTimeField
                label="End date"
                mode="date"
                value={dateFromString(values.endDate)}
                onChange={date => update({ endDate: toDateString(date) })}
                error={errors.endDate}
              />
            )}
          </View>

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Time
            </LifeText>
            <LifePills
              options={TIME_OPTIONS}
              value={values.hasTime ? 'At time' : 'All day'}
              onChange={option => update({ hasTime: option === 'At time' })}
            />
            {values.hasTime && (
              <View className="gap-life-3">
                <LifeDateTimeField
                  label="Start time"
                  mode="time"
                  value={timeFromString(values.startTime)}
                  onChange={handleStartTime}
                />
                <LifePills
                  options={END_TIME_OPTIONS}
                  value={values.hasEndTime ? 'Set end time' : 'No end time'}
                  onChange={option =>
                    update({
                      hasEndTime: option === 'Set end time',
                      endTime: addMinutesToTime(values.startTime, 60),
                    })
                  }
                />
                {values.hasEndTime && (
                  <LifeDateTimeField
                    label="End time"
                    mode="time"
                    value={timeFromString(values.endTime)}
                    onChange={date => update({ endTime: timeToString(date) })}
                    error={errors.endTime}
                  />
                )}
              </View>
            )}
            {overlap ? (
              <LifeText variant="caption" color="text-life-danger">
                Overlaps with "{overlap.title}" (
                {formatDayShort(overlap.plan_date)},{' '}
                {formatPlanTimeSpan(overlap)}).
              </LifeText>
            ) : null}
          </View>

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              {values.hasTime ? 'Reminder (before start)' : 'Reminder'}
            </LifeText>
            {values.hasTime ? (
              <LifePills
                options={TIMED_REMINDER_OPTIONS}
                value={values.reminder}
                onChange={reminder => update({ reminder })}
              />
            ) : (
              <>
                <LifePills
                  options={ALL_DAY_REMINDER_OPTIONS}
                  value={values.hasAllDayReminder ? 'At a set time' : 'None'}
                  onChange={option =>
                    update({ hasAllDayReminder: option === 'At a set time' })
                  }
                />
                {values.hasAllDayReminder && (
                  <LifeDateTimeField
                    label="Remind me at"
                    mode="time"
                    value={timeFromString(values.remindTime)}
                    onChange={date =>
                      update({ remindTime: timeToString(date) })
                    }
                  />
                )}
              </>
            )}
          </View>

          <LifeInput
            label="Notes (optional)"
            placeholder="Anything to remember"
            value={values.notes}
            maxLength={NOTES_MAX_LENGTH}
            multiline
            onChangeText={notes => update({ notes })}
          />

          {isEdit && (
            <TouchableOpacity
              accessibilityRole="button"
              className="items-center"
              onPress={handleDelete}
            >
              <LifeText
                variant="bodySm"
                className="font-semibold text-life-danger"
              >
                Delete Plan
              </LifeText>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View className="items-center border-t border-life-border bg-life-bg px-life-5 pb-life-3 pt-life-3">
          <LifeButton
            title={saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Plan'}
            disabled={!isValid || saving}
            onPress={handleSubmit}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PlanFormScreen;
