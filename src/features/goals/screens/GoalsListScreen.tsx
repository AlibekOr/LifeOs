import { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import LifeFab from '../../../shared/components/Fab/LifeFab.tsx';
import type { Goal } from '../../../types/goal.types.ts';
import type { Task } from '../../../types/task.types.ts';
import CompletedGoalItem from '../components/CompletedGoalItem.tsx';
import FeaturedGoalCard from '../components/FeaturedGoalCard.tsx';
import GoalListItem from '../components/GoalListItem.tsx';
import { useGoalsData } from '../hooks/useGoalsData.ts';
import {
  countCompletedMilestones,
  goalProgress,
  pickFeaturedGoal,
  splitGoals,
} from '../utils/goalProgress.ts';
import type { GoalsListScreenProps } from './type.ts';

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

const GoalsListScreen = ({ navigation }: GoalsListScreenProps) => {
  const {
    goals,
    milestones,
    tasks,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useGoalsData();
  const linkedTasks = tasks ?? EMPTY_TASKS;

  const { active, completed } = useMemo(() => splitGoals(goals ?? []), [goals]);
  const featured = useMemo(
    () => pickFeaturedGoal(active, linkedTasks),
    [active, linkedTasks],
  );
  const others = useMemo(
    () => active.filter(goal => goal.id !== featured?.id),
    [active, featured],
  );
  const featuredMilestones = useMemo(
    () =>
      featured ? (milestones ?? []).filter(m => m.goal_id === featured.id) : [],
    [featured, milestones],
  );

  const openGoal = (goal: Goal) =>
    navigation.navigate('GoalDetail', { goalId: goal.id });
  const addGoal = () => navigation.navigate('GoalForm');

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <View className="px-life-5 pb-life-3 pt-life-3">
        <LifeText variant="h2" className="font-bold">
          Goals
        </LifeText>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366F1" />
        </View>
      ) : isError ? (
        <View className="px-life-5">
          <View className="gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-4">
            <LifeText variant="bodySm" color="text-life-danger">
              {error instanceof Error ? error.message : 'Failed to load goals.'}
            </LifeText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => refetch()}
            >
              <LifeText
                variant="bodySm"
                className="font-semibold text-life-accent"
              >
                Retry
              </LifeText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (goals ?? []).length === 0 ? (
        <View className="flex-1 items-center justify-center px-life-5">
          <View className="w-full items-center gap-life-4 rounded-life-lg border border-life-border bg-life-surface p-life-6">
            <LifeText variant="body" className="font-semibold">
              No goals yet
            </LifeText>
            <LifeText variant="bodySm" color="text-life-muted">
              Set a goal, then link tasks to it to track your progress.
            </LifeText>
            <LifeButton title="Add a goal" onPress={addGoal} fullWidth />
          </View>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-life-5 px-life-5 pb-[96px]"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {featured ? (
            <FeaturedGoalCard
              goal={featured}
              progress={goalProgress(featured.id, linkedTasks)}
              milestoneCount={featuredMilestones.length}
              completedMilestones={countCompletedMilestones(
                featuredMilestones,
                linkedTasks,
              )}
              onPress={openGoal}
            />
          ) : null}

          {others.length > 0 ? (
            <View className="gap-life-3">
              <SectionTitle title="ACTIVE GOALS" />
              {others.map(goal => (
                <GoalListItem
                  key={goal.id}
                  goal={goal}
                  progress={goalProgress(goal.id, linkedTasks)}
                  onPress={openGoal}
                />
              ))}
            </View>
          ) : null}

          {completed.length > 0 ? (
            <View className="gap-life-3">
              <SectionTitle title="COMPLETED GOALS" />
              {completed.map(goal => (
                <CompletedGoalItem
                  key={goal.id}
                  goal={goal}
                  onPress={openGoal}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <LifeFab accessibilityLabel="Add goal" onPress={addGoal} />
    </SafeAreaView>
  );
};

export default GoalsListScreen;
