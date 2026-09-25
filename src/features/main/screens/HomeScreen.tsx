import { useMemo, useState } from 'react';
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
import LifeProgressRing from '../../../shared/components/ProgressRing/LifeProgressRing.tsx';
import LifeSpeedDial from '../../../shared/components/Fab/LifeSpeedDial.tsx';
import LifeSegmentedControl from '../../../shared/components/SegmentedControl/LifeSegmentedControl.tsx';
import LifeIcon from '../../../assets/icons/LifeIcon.tsx';
import { useNotifications } from '../../notifications/hooks/useNotifications.ts';
import { useAuthStore } from '../../../services/storage/authStore.ts';
import { MINUTE_MS, useNow } from '../../../hooks/useNow.ts';
import { capitalizeFirst } from '../../../utils/capitalize.ts';
import { getGreeting } from '../../../utils/greeting.ts';
import { useToggleTaskCompletion } from '../../tasks/hooks/useTasks.ts';
import { useTasksWithPending } from '../../tasks/hooks/useTasksWithPending.ts';
import { useProfile } from '../../profile/hooks/useProfile.ts';
import TaskListItem from '../../tasks/components/TaskListItem.tsx';
import {
  isTaskActive,
  sortTasksCompletedLast,
} from '../../tasks/utils/taskStatus.ts';
import UpcomingPlans from '../../plans/components/UpcomingPlans.tsx';
import { usePlans } from '../../plans/hooks/usePlans.ts';
import { usePlanRange } from '../../plans/hooks/usePlanRange.ts';
import { selectUpcomingPlans } from '../../plans/utils/upcomingPlans.ts';
import { currentYearMonth } from '../../finance/utils/month.ts';
import SyncStatusBanner from '../components/SyncStatusBanner.tsx';
import NowCard from '../components/NowCard.tsx';
import { useNowCardActions } from '../hooks/useNowCardActions.ts';
import type {
  DisplayPlan,
  DisplayTask,
} from '../../../types/pendingSync.types.ts';
import type { HomeScreenProps } from './type.ts';

// Hidden for now; the AI Advisor card will be reworked or removed later.
const SHOW_AI_ADVISOR = false;

type HomeFilter = 'all' | 'tasks' | 'plans';

const FILTER_OPTIONS: { value: HomeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'plans', label: 'Plans' },
];

function formatToday(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function lifeScoreLabel(score: number, total: number, completed: number) {
  if (total === 0) return "Let's plan your day";
  if (completed === 0) return "Let's get started";
  if (score >= 80) return 'Life Score · Optimal';
  if (score >= 50) return 'Life Score · Good';
  return 'Life Score · Needs Focus';
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  // Task statuses and the Now card change on minute boundaries.
  const now = useNow(MINUTE_MS);
  const { unreadCount } = useNotifications();
  const user = useAuthStore(state => state.user);
  const { data: profile } = useProfile();
  const authFullName = (
    user?.user_metadata?.full_name as string | undefined
  )?.trim();
  const fullName = profile?.full_name?.trim() || authFullName;
  const rawFirstName = fullName?.split(' ')[0] || user?.email?.split('@')[0];
  // Names are shown with a capital first letter, however they were typed; the
  // "there" fallback stays lower case to read "Good evening, there".
  const firstName = rawFirstName ? capitalizeFirst(rawFirstName) : 'there';

  const {
    tasks: allTasks,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTasksWithPending();
  const toggleCompletion = useToggleTaskCompletion();
  const nowCardActions = useNowCardActions();

  const [filter, setFilter] = useState<HomeFilter>('all');
  // Same range as the Plans tab, so both read one cached query.
  const planRange = usePlanRange();
  const { plans, refetch: refetchPlans } = usePlans(planRange);
  const upcomingPlans = useMemo(
    () => selectUpcomingPlans(plans ?? [], now),
    [plans, now],
  );
  const showTasks = filter !== 'plans';
  const showPlans = filter !== 'tasks';

  const handleRefresh = () => {
    refetch();
    refetchPlans();
  };

  const handleEditPlan = (plan: DisplayPlan) =>
    navigation.navigate('Tasks', {
      screen: 'PlanForm',
      params: { planId: plan.id },
      initial: false,
    });

  const handleSeeAllPlans = () =>
    navigation.navigate('Tasks', {
      screen: 'TasksList',
      params: { tab: 'plans' },
    });

  const handleEditTask = (task: DisplayTask) =>
    // initial: false keeps TasksList underneath, as for the Add task button.
    navigation.navigate('Tasks', {
      screen: 'TaskForm',
      params: { taskId: task.id },
      initial: false,
    });

  const tasks = useMemo(() => {
    // Derived from `now` so "today" rolls over when the app is reopened after
    // midnight; same format as task.due_date.
    const todayDate = now.toLocaleDateString('en-CA');
    return allTasks?.filter(task => task.due_date === todayDate);
  }, [allTasks, now]);

  // Home only lists what is still actual today: not finished, not missed and
  // not timed out. The Tasks screen keeps the full history.
  const activeTasks = useMemo(
    () =>
      sortTasksCompletedLast(
        (tasks ?? []).filter(task => isTaskActive(task, now)),
      ),
    [tasks, now],
  );

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
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
      >
        {/* Extra bottom space keeps Plan My Day and the last task clear of the FAB. */}
        <View className="gap-life-5 px-life-5 pb-[96px] pt-life-3">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <LifeText variant="h2" className="font-bold">
                {getGreeting(now)}, {firstName}
              </LifeText>
              <LifeText variant="bodySm" color="text-life-muted">
                {formatToday(now)}
              </LifeText>
            </View>
            <View className="flex-row items-center gap-life-3">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : 'Notifications'
                }
                onPress={() => navigation.navigate('Notifications')}
                className="h-12 w-12 items-center justify-center rounded-full border border-life-border bg-life-surface"
              >
                <LifeIcon name="bell" size={22} color="#FFFFFF" />
                {unreadCount > 0 ? (
                  <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-life-danger px-life-1">
                    <LifeText variant="caption" className="font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </LifeText>
                  </View>
                ) : null}
              </TouchableOpacity>
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
          </View>

          <SyncStatusBanner />

          <NowCard
            tasks={allTasks ?? []}
            now={now}
            pendingAction={nowCardActions.pendingAction}
            onEditTask={handleEditTask}
            onStart={nowCardActions.start}
            onComplete={nowCardActions.complete}
            onExtend={nowCardActions.extend}
          />

          {/* Life Score */}
          <View className="flex-row items-center gap-life-4 rounded-life-2xl border border-life-border bg-life-surface p-life-5">
            <LifeProgressRing
              progress={lifeScore}
              size={72}
              strokeWidth={6}
              showEmptyDot
            >
              <LifeText variant="h3" className="font-bold">
                {lifeScore}
              </LifeText>
            </LifeProgressRing>
            <View className="flex-1 gap-life-1">
              <LifeText variant="body" className="font-semibold">
                {lifeScoreLabel(lifeScore, totalTasks, completedTasks)}
              </LifeText>
              <LifeText variant="bodySm" color="text-life-muted">
                {completedTasks} of {totalTasks} tasks completed today
              </LifeText>
            </View>
          </View>

          {/* AI Advisor */}
          {SHOW_AI_ADVISOR ? (
            <View className="gap-life-2 rounded-life-2xl border border-life-primary/30 bg-life-surface p-life-5">
              <View className="flex-row items-center gap-life-2">
                <LifeIcon name="sparkles" size={16} color="#818CF8" />
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
          ) : null}

          <LifeSegmentedControl
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
          />

          {/* Today's Schedule */}
          {showTasks ? (
            <View className="gap-life-3">
              <LifeText variant="h3" className="font-bold">
                Today's Schedule
              </LifeText>

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
              ) : activeTasks.length === 0 ? (
                <View className="items-center rounded-life-lg border border-life-border bg-life-surface p-life-6">
                  <LifeText variant="bodySm" color="text-life-muted">
                    {totalTasks === 0
                      ? 'No tasks scheduled for today.'
                      : 'Nothing else scheduled for today.'}
                  </LifeText>
                </View>
              ) : (
                <View className="gap-life-3">
                  {activeTasks.map(task => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      now={now}
                      onToggleComplete={handleToggle}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {showPlans ? (
            <UpcomingPlans
              entries={upcomingPlans}
              showEmpty={filter === 'plans'}
              onSeeAll={handleSeeAllPlans}
              onPressPlan={handleEditPlan}
            />
          ) : null}

          {/* Plan My Day */}
          <TouchableOpacity
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-life-2 rounded-life-lg bg-life-primary py-life-4"
            onPress={() => {}}
          >
            <LifeIcon name="sparkles" size={18} />
            <LifeText variant="body" className="font-semibold">
              Plan My Day
            </LifeText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* initial: false keeps the list underneath; otherwise the form would become
          the stack's only screen and its tab would open on it. */}
      <LifeSpeedDial
        accessibilityLabel="Add"
        actions={[
          {
            label: 'Plan',
            icon: 'calendar',
            onPress: () =>
              navigation.navigate('Tasks', {
                screen: 'PlanForm',
                initial: false,
              }),
          },
          {
            label: 'Task',
            icon: 'list-checks',
            onPress: () =>
              navigation.navigate('Tasks', {
                screen: 'TaskForm',
                initial: false,
              }),
          },
          {
            label: 'Finance',
            icon: 'wallet',
            onPress: () =>
              navigation.navigate('Finance', {
                screen: 'TransactionForm',
                params: { yearMonth: currentYearMonth() },
                initial: false,
              }),
          },
        ]}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
