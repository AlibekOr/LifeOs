import { useEffect, useMemo, useRef, useState } from 'react';
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
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus.ts';
import {
  useCreateGoal,
  useCreateMilestone,
  useDeleteGoal,
  useDeleteMilestone,
  useGoalMilestones,
  useGoals,
  useUpdateGoal,
  useUpdateMilestone,
} from '../hooks/useGoals.ts';
import { GOAL_CATEGORIES } from '../utils/goalCategories.ts';
import {
  MAX_MILESTONES,
  TITLE_MAX_LENGTH,
  buildGoalInput,
  defaultGoalFormValues,
  goalToFormValues,
  validateGoalForm,
  type GoalFormValues,
} from '../utils/goalForm.ts';
import { planMilestoneChanges } from '../utils/milestoneChanges.ts';
import { dateFromString } from '../../plans/utils/planForm.ts';
import { toDateString } from '../../plans/utils/planDates.ts';
import type { GoalCategory } from '../../../types/goal.types.ts';
import type { GoalFormScreenProps } from './type.ts';

type DeadlineOption = 'No deadline' | 'Set deadline';

const DEADLINE_OPTIONS: DeadlineOption[] = ['No deadline', 'Set deadline'];

const GoalFormScreen = ({ navigation, route }: GoalFormScreenProps) => {
  const goalId = route.params?.goalId;
  const isEdit = Boolean(goalId);

  const { data: goals, isLoading } = useGoals();
  const { data: allMilestones } = useGoalMilestones();
  const { isOnline } = useNetworkStatus();
  const existingGoal = goalId
    ? goals?.find(goal => goal.id === goalId)
    : undefined;
  const existingMilestones = useMemo(
    () => (allMilestones ?? []).filter(m => m.goal_id === goalId),
    [allMilestones, goalId],
  );

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [values, setValues] = useState<GoalFormValues>(() =>
    defaultGoalFormValues(new Date()),
  );
  const [titleTouched, setTitleTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  // Populate once per goal so a background refetch never overwrites typing.
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const newRowCount = useRef(0);

  useEffect(() => {
    if (existingGoal && allMilestones && existingGoal.id !== hydratedId) {
      setHydratedId(existingGoal.id);
      setValues(goalToFormValues(existingGoal, existingMilestones, new Date()));
    }
  }, [existingGoal, allMilestones, existingMilestones, hydratedId]);

  const errors = validateGoalForm(values);
  const isValid = Object.keys(errors).length === 0;

  const update = (patch: Partial<GoalFormValues>) =>
    setValues(previous => ({ ...previous, ...patch }));

  const addMilestone = () => {
    if (values.milestones.length >= MAX_MILESTONES) {
      return;
    }
    const key = `new-${newRowCount.current++}`;
    setValues(previous => ({
      ...previous,
      milestones: [...previous.milestones, { id: null, key, title: '' }],
    }));
  };

  const renameMilestone = (key: string, title: string) =>
    setValues(previous => ({
      ...previous,
      milestones: previous.milestones.map(milestone =>
        milestone.key === key ? { ...milestone, title } : milestone,
      ),
    }));

  const removeMilestone = (key: string) =>
    setValues(previous => ({
      ...previous,
      milestones: previous.milestones.filter(
        milestone => milestone.key !== key,
      ),
    }));

  const handleSubmit = async () => {
    setTitleTouched(true);
    if (!isValid || saving) {
      return;
    }
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        'Saving a goal needs a connection. Please try again when you reconnect.',
      );
      return;
    }

    setSaving(true);
    try {
      const input = buildGoalInput(values);
      const saved =
        isEdit && goalId
          ? await updateGoal.mutateAsync({ id: goalId, input })
          : await createGoal.mutateAsync(input);

      // The goal is saved from here on. A failing milestone must not look like a
      // failed save, or a retry would create the goal twice.
      let milestonesFailed = false;
      try {
        const changes = planMilestoneChanges(
          isEdit ? existingMilestones : [],
          values.milestones,
        );
        for (const id of changes.remove) {
          await deleteMilestone.mutateAsync(id);
        }
        for (const item of changes.update) {
          await updateMilestone.mutateAsync({
            id: item.id,
            input: { title: item.title, position: item.position },
          });
        }
        for (const item of changes.create) {
          await createMilestone.mutateAsync({
            goal_id: saved.id,
            title: item.title,
            position: item.position,
          });
        }
      } catch (milestoneError) {
        console.error('[GoalForm] Milestone update failed', milestoneError);
        milestonesFailed = true;
      }

      if (milestonesFailed) {
        Alert.alert(
          'Goal saved',
          "Your goal was saved, but some milestones couldn't be saved. You can edit the goal to try again.",
        );
      }
      navigation.goBack();
    } catch (error) {
      console.error('[GoalForm] Failed to save goal', error);
      Alert.alert('Could not save goal', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!goalId) {
      return;
    }
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        'Deleting a goal needs a connection. Please try again when you reconnect.',
      );
      return;
    }
    Alert.alert(
      'Delete goal?',
      'Its tasks stay, but they are no longer linked to it. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal.mutateAsync(goalId);
              // The goal's own screen is gone too, so go back to the list.
              navigation.popToTop();
            } catch (error) {
              console.error('[GoalForm] Failed to delete goal', error);
              Alert.alert('Could not delete goal', 'Please try again.');
            }
          },
        },
      ],
    );
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
        {isEdit ? 'Edit Goal' : 'New Goal'}
      </LifeText>
      <View className="w-14" />
    </View>
  );

  if (isEdit && !existingGoal) {
    return (
      <SafeAreaView className="flex-1 bg-life-bg" edges={['top', 'bottom']}>
        {header}
        <View className="flex-1 items-center justify-center px-life-5">
          {isLoading ? (
            <ActivityIndicator color="#6366F1" />
          ) : (
            <LifeText variant="bodySm" color="text-life-muted">
              This goal could not be found.
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
            placeholder="What do you want to achieve?"
            value={values.title}
            maxLength={TITLE_MAX_LENGTH}
            onChangeText={title => update({ title })}
            onBlur={() => setTitleTouched(true)}
            error={titleTouched ? errors.title : undefined}
          />

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Category
            </LifeText>
            <LifePills
              options={GOAL_CATEGORIES}
              value={values.category}
              onChange={(category: GoalCategory) => update({ category })}
            />
          </View>

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Deadline
            </LifeText>
            <LifePills
              options={DEADLINE_OPTIONS}
              value={values.hasDeadline ? 'Set deadline' : 'No deadline'}
              onChange={option =>
                update({ hasDeadline: option === 'Set deadline' })
              }
            />
            {values.hasDeadline ? (
              <LifeDateTimeField
                label="Deadline date"
                mode="date"
                value={dateFromString(values.deadline)}
                onChange={date => update({ deadline: toDateString(date) })}
              />
            ) : null}
          </View>

          <View className="gap-life-3">
            <View className="gap-life-1">
              <LifeText
                variant="bodySm"
                className="font-medium text-life-muted"
              >
                Milestones (optional)
              </LifeText>
              <LifeText variant="caption" color="text-life-subtle">
                Link tasks to a milestone in the task form. Its progress follows
                those tasks.
              </LifeText>
            </View>
            {values.milestones.map(milestone => (
              <LifeInput
                key={milestone.key}
                placeholder="Milestone name"
                value={milestone.title}
                maxLength={TITLE_MAX_LENGTH}
                onChangeText={title => renameMilestone(milestone.key, title)}
                rightElement={
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Remove milestone"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => removeMilestone(milestone.key)}
                  >
                    <LifeIcon name="x" size={18} color="#9494A1" />
                  </TouchableOpacity>
                }
              />
            ))}
            <LifeButton
              title="Add milestone"
              variant="secondary"
              onPress={addMilestone}
              disabled={values.milestones.length >= MAX_MILESTONES}
              fullWidth
            />
          </View>

          {isEdit ? (
            <TouchableOpacity
              accessibilityRole="button"
              className="items-center"
              onPress={handleDelete}
            >
              <LifeText
                variant="bodySm"
                className="font-semibold text-life-danger"
              >
                Delete Goal
              </LifeText>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <View className="items-center border-t border-life-border bg-life-bg px-life-5 pb-life-3 pt-life-3">
          <LifeButton
            title={saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Goal'}
            disabled={!isValid || saving}
            onPress={handleSubmit}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GoalFormScreen;
