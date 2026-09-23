import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeProgressRing from '../../../shared/components/ProgressRing/LifeProgressRing.tsx';
import { useAuthStore } from '../../../services/storage/authStore.ts';
import { todayDateString } from '../../../services/task.service.ts';
import { useToggleTaskCompletion } from '../../tasks/hooks/useTasks.ts';
import { useTasksWithPending } from '../../tasks/hooks/useTasksWithPending.ts';
import { useProfile } from '../../profile/hooks/useProfile.ts';
import TaskListItem from '../../tasks/components/TaskListItem.tsx';
import SyncStatusBanner from '../components/SyncStatusBanner.tsx';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import type { HomeScreenProps } from './type.ts';

const sparkleIcon = require('../../../shared/assets/notifications/sparkles.png');

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function lifeScoreLabel(score: number) {
  if (score >= 80) return 'Life Score Optimal';
  if (score >= 50) return 'Life Score Good';
  return 'Life Score Needs Focus';
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const user = useAuthStore(state => state.user);
  const { data: profile } = useProfile();
  const authFullName = (
    user?.user_metadata?.full_name as string | undefined
  )?.trim();
  const fullName = profile?.full_name?.trim() || authFullName;
  const firstName =
    fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  const {
    tasks: allTasks,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTasksWithPending();
  const toggleCompletion = useToggleTaskCompletion();

  const tasks = useMemo(() => {
    const todayDate = todayDateString();
    return allTasks?.filter(task => task.due_date === todayDate);
  }, [allTasks]);

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter(task => task.is_completed).length ?? 0;
  const completionPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const lifeScore = completionPercent;

  const handleToggle = (task: DisplayTask) => {
    toggleCompletion.mutate(
      { id: task.id, isCompleted: !task.is_completed },
      {
        onError: err => {
          console.error(err);
          Alert.alert('Could not update task. Please try again.');
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View className="gap-life-5 px-life-5 pb-life-10 pt-life-3">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <LifeText variant="h2" className="font-bold">
                Good morning, {firstName} 👋
              </LifeText>
              <LifeText variant="bodySm" color="text-life-muted">
                {today}
              </LifeText>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => navigation.navigate('Profile')}
              className="h-12 w-12 items-center justify-center rounded-full border border-life-border bg-life-surface"
            >
              <LifeText variant="body" className="font-semibold">
                {firstName.charAt(0).toUpperCase()}
              </LifeText>
            </TouchableOpacity>
          </View>

          <SyncStatusBanner />

          {/* Life Score */}
          <View className="flex-row items-center gap-life-4 rounded-life-2xl border border-life-border bg-life-surface p-life-5">
            <LifeProgressRing progress={lifeScore} size={72} strokeWidth={6}>
              <LifeText variant="h3" className="font-bold">
                {lifeScore}
              </LifeText>
            </LifeProgressRing>
            <View className="flex-1 gap-life-1">
              <LifeText variant="body" className="font-semibold">
                {lifeScoreLabel(lifeScore)}
              </LifeText>
              <LifeText variant="bodySm" color="text-life-muted">
                {completedTasks} of {totalTasks} tasks completed today
              </LifeText>
            </View>
          </View>

          {/* AI Advisor */}
          <View className="gap-life-2 rounded-life-2xl border border-life-border bg-life-surface p-life-5">
            <View className="flex-row items-center gap-life-2">
              <Image source={sparkleIcon} className="h-4 w-4" />
              <LifeText
                variant="bodySm"
                className="font-semibold text-life-accent"
              >
                AI ADVISOR
              </LifeText>
            </View>
            <LifeText variant="body" color="text-life-muted">
              {totalTasks === 0
                ? 'You have no tasks scheduled yet. Add your first task to start planning your day.'
                : `You have ${totalTasks} task${
                    totalTasks === 1 ? '' : 's'
                  } today. Focus on the highest priority ones first.`}
            </LifeText>
          </View>

          {/* Today's Schedule */}
          <View className="gap-life-3">
            <View className="flex-row items-center justify-between">
              <LifeText variant="h3" className="font-bold">
                Today's Schedule
              </LifeText>
              <LifeText variant="bodySm" color="text-life-muted">
                {completionPercent}% done
              </LifeText>
            </View>

            <View className="h-1.5 w-full overflow-hidden rounded-full bg-life-border">
              <View
                className="h-full rounded-full bg-life-primary"
                style={{ width: `${completionPercent}%` }}
              />
            </View>

            {isLoading ? (
              <View className="items-center py-life-6">
                <ActivityIndicator color="#6366F1" />
              </View>
            ) : isError ? (
              <View className="gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-4">
                <LifeText variant="bodySm" color="text-life-danger">
                  {error instanceof Error
                    ? error.message
                    : 'Failed to load tasks.'}
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
            ) : totalTasks === 0 ? (
              <View className="items-center rounded-life-lg border border-life-border bg-life-surface p-life-6">
                <LifeText variant="bodySm" color="text-life-muted">
                  No tasks scheduled for today.
                </LifeText>
              </View>
            ) : (
              <View className="gap-life-3">
                {tasks?.map(task => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggle}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Plan My Day */}
          <TouchableOpacity
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-life-2 rounded-life-lg bg-life-primary py-life-4"
            onPress={() => {}}
          >
            <Image source={sparkleIcon} className="h-4 w-4" />
            <LifeText variant="body" className="font-semibold">
              Plan My Day
            </LifeText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
