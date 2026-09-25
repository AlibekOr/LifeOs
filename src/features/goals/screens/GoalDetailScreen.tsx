import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import LifeProgressRing from '../../../shared/components/ProgressRing/LifeProgressRing.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus.ts';
import { useNow } from '../../../hooks/useNow.ts';
import type { Task } from '../../../types/task.types.ts';
import MilestoneRow from '../components/MilestoneRow.tsx';
import { useGoalsData } from '../hooks/useGoalsData.ts';
import { useSetGoalCompleted } from '../hooks/useGoals.ts';
import {
  calcProgress,
  describeTimeRemaining,
  formatMonthYearLong,
  goalProgress,
  milestoneProgress,
} from '../utils/goalProgress.ts';
import type { GoalDetailScreenProps } from './type.ts';

const EMPTY_TASKS: Task[] = [];

const SectionTitle = ({ title }: { title: string }) => (
  <LifeText
    variant="caption"
    color="text-life-muted"
    className="font-semibold tracking-wider"
  >
    {title}
  </LifeText>
);

const GoalDetailScreen = ({ navigation, route }: GoalDetailScreenProps) => {
  const { goalId } = route.params;
  const { goals, milestones, tasks, isLoading, isRefetching, refetch } =
    useGoalsData();
  const { isOnline } = useNetworkStatus();
  const setCompleted = useSetGoalCompleted();
  const now = useNow();

  const goal = goals?.find(item => item.id === goalId);
  const linkedTasks = tasks ?? EMPTY_TASKS;

  const goalMilestones = useMemo(
    () =>
      (milestones ?? [])
        .filter(milestone => milestone.goal_id === goalId)
        .sort((a, b) => a.position - b.position),
    [milestones, goalId],
  );

  const header = (title: string) => (
    <View className="h-12 flex-row items-center gap-life-3 px-life-4">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={() => navigation.goBack()}
      >
        <LifeIcon name="chevron-left" size={24} />
      </TouchableOpacity>
      <LifeText variant="h3" className="flex-1 font-bold" numberOfLines={1}>
        {title}
      </LifeText>
    </View>
  );

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
        {header('Goal')}
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

  const progress = goalProgress(goal.id, linkedTasks);
  const isCompleted = goal.completed_at !== null;
  const canComplete =
    !isCompleted && progress.total > 0 && progress.percent === 100;
  const tasksWithoutMilestone = calcProgress(
    linkedTasks.filter(
      task => task.goal_id === goal.id && task.milestone_id === null,
    ),
  );
  const remaining = goal.deadline
    ? describeTimeRemaining(goal.deadline, now)
    : null;

  const handleSetCompleted = (completed: boolean) => {
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        'Changing a goal needs a connection. Please try again when you reconnect.',
      );
      return;
    }
    setCompleted.mutate(
      { id: goal.id, completed },
      {
        onError: error => {
          console.error('[GoalDetail] Failed to update goal', error);
          Alert.alert('Could not update the goal. Please try again.');
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      {header(goal.title)}
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-life-5 px-life-5 pb-life-10 pt-life-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View className="flex-row items-center gap-life-4 rounded-life-2xl border border-life-border bg-life-surface p-life-5">
          <LifeProgressRing
            progress={progress.percent}
            size={72}
            strokeWidth={6}
            showEmptyDot
          >
            <LifeText variant="h3" className="font-bold">
              {progress.percent}%
            </LifeText>
          </LifeProgressRing>
          <View className="flex-1 gap-life-1">
            <LifeText
              variant="caption"
              color="text-life-muted"
              className="tracking-wider"
            >
              {isCompleted ? 'COMPLETED' : 'DEADLINE'}
            </LifeText>
            <LifeText variant="h3" className="font-bold">
              {isCompleted && goal.completed_at
                ? formatMonthYearLong(goal.completed_at)
                : goal.deadline
                ? formatMonthYearLong(goal.deadline)
                : 'Not set'}
            </LifeText>
            {!isCompleted && remaining ? (
              <LifeText
                variant="bodySm"
                color={
                  remaining.startsWith('Overdue')
                    ? 'text-life-danger'
                    : 'text-life-accent'
                }
              >
                {remaining}
              </LifeText>
            ) : null}
          </View>
        </View>

        <View className="gap-life-3">
          <SectionTitle title="MILESTONES PROGRESS" />
          {goalMilestones.map(milestone => (
            <MilestoneRow
              key={milestone.id}
              title={milestone.title}
              progress={milestoneProgress(milestone.id, linkedTasks)}
            />
          ))}
          {goalMilestones.length === 0 || tasksWithoutMilestone.total > 0 ? (
            <MilestoneRow
              title={goalMilestones.length === 0 ? 'Tasks' : 'Other tasks'}
              progress={tasksWithoutMilestone}
            />
          ) : null}
          {progress.total === 0 ? (
            <LifeText variant="bodySm" color="text-life-muted">
              Link tasks to this goal in the task form to track its progress.
            </LifeText>
          ) : null}
        </View>

        <View className="gap-life-3">
          {canComplete ? (
            <LifeButton
              title="Mark as completed"
              onPress={() => handleSetCompleted(true)}
              disabled={setCompleted.isPending}
              fullWidth
            />
          ) : null}
          {isCompleted ? (
            <LifeButton
              title="Reopen goal"
              variant="secondary"
              onPress={() => handleSetCompleted(false)}
              disabled={setCompleted.isPending}
              fullWidth
            />
          ) : null}
          <LifeButton
            title="Edit Goal"
            variant="secondary"
            onPress={() => navigation.navigate('GoalForm', { goalId: goal.id })}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GoalDetailScreen;
