import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeFab from '../../../shared/components/Fab/LifeFab.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import LifeSegmentedControl from '../../../shared/components/SegmentedControl/LifeSegmentedControl.tsx';
import PlansView from '../../plans/components/PlansView.tsx';
import TaskListItem from '../components/TaskListItem.tsx';
import TaskSectionHeader from '../components/TaskSectionHeader.tsx';
import PriorityFilterRow from '../components/PriorityFilterRow.tsx';
import SyncStatusBanner from '../../main/components/SyncStatusBanner.tsx';
import { useToggleTaskCompletion } from '../hooks/useTasks.ts';
import { useTasksWithPending } from '../hooks/useTasksWithPending.ts';
import { usePendingSyncStore } from '../../../store/pendingSync.store.ts';
import { groupTasksByDate } from '../utils/groupTasksByDate.ts';
import { sortTasksCompletedLast } from '../utils/taskStatus.ts';
import { MINUTE_MS, useNow } from '../../../hooks/useNow.ts';
import type { TaskFilterPriority } from '../../../types/task.types.ts';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import type { TasksListTab } from '../../../app/navigation/types.ts';
import type { TasksListScreenProps } from './type.ts';

const TAB_OPTIONS: { value: TasksListTab; label: string }[] = [
  { value: 'tasks', label: 'Tasks' },
  { value: 'plans', label: 'Plans' },
];

const TasksListScreen = ({ navigation, route }: TasksListScreenProps) => {
  const tabParam = route.params?.tab;
  const [tab, setTab] = useState<TasksListTab>(tabParam ?? 'tasks');
  const [priorityFilter, setPriorityFilter] =
    useState<TaskFilterPriority>('All');

  // Another screen (Home's "See all") asked for a tab; use it once, then clear
  // it so switching tabs by hand is not overridden on the next render.
  useEffect(() => {
    if (tabParam) {
      setTab(tabParam);
      navigation.setParams({ tab: undefined });
    }
  }, [tabParam, navigation]);

  const { tasks, isLoading, isError, error, refetch, isRefetching } =
    useTasksWithPending();
  // Statuses (NOW, Overdue, Missed) change on minute boundaries.
  const now = useNow(MINUTE_MS);
  const toggleCompletion = useToggleTaskCompletion();
  const retryEntry = usePendingSyncStore(state => state.retryEntry);
  const discardEntry = usePendingSyncStore(state => state.discardEntry);

  const filteredTasks = useMemo(
    () =>
      (tasks ?? []).filter(
        task => priorityFilter === 'All' || task.priority === priorityFilter,
      ),
    [tasks, priorityFilter],
  );

  // Sorted before grouping so completed tasks sink to the bottom of each day.
  const sections = useMemo(
    () => groupTasksByDate(sortTasksCompletedLast(filteredTasks)),
    [filteredTasks],
  );

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

  const openEditor = (task: DisplayTask) => {
    navigation.navigate('TaskForm', { taskId: task.id });
  };

  const handlePress = (task: DisplayTask) => {
    if (task.syncStatus !== 'failed') {
      openEditor(task);
      return;
    }
    Alert.alert(
      'Sync failed',
      `"${task.title}" couldn't be saved to your account. Retry, edit it, or discard your unsynced changes.`,
      [
        { text: 'Retry', onPress: () => retryEntry(task.id) },
        { text: 'Edit', onPress: () => openEditor(task) },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => discardEntry(task.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleAdd = () => {
    navigation.navigate('TaskForm');
  };

  const handleAddPlan = () => {
    navigation.navigate('PlanForm');
  };

  const handleEditPlan = (planId: string) => {
    navigation.navigate('PlanForm', { planId });
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <View className="gap-life-4 px-life-5 pb-life-3 pt-life-3">
        <LifeText variant="h2" className="font-bold">
          {tab === 'plans' ? 'Plans' : 'Tasks'}
        </LifeText>
        <LifeSegmentedControl
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
        />
        {tab === 'tasks' ? (
          <PriorityFilterRow
            value={priorityFilter}
            onChange={setPriorityFilter}
          />
        ) : null}
        <SyncStatusBanner />
      </View>

      {tab === 'plans' ? (
        <PlansView onAddPlan={handleAddPlan} onEditPlan={handleEditPlan} />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366F1" />
        </View>
      ) : isError ? (
        <View className="gap-life-3 px-life-5">
          <View className="gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-4">
            <LifeText variant="bodySm" color="text-life-danger">
              {error instanceof Error ? error.message : 'Failed to load tasks.'}
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
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-life-5">
          <View className="w-full items-center rounded-life-lg border border-life-border bg-life-surface p-life-6">
            <LifeText variant="bodySm" color="text-life-muted">
              {priorityFilter === 'All'
                ? 'No tasks yet. Tap + to add one.'
                : `No ${priorityFilter} priority tasks.`}
            </LifeText>
            {priorityFilter !== 'All' ? (
              <View className="w-full pt-life-4">
                <LifeButton
                  title="Show all"
                  onPress={() => setPriorityFilter('All')}
                  fullWidth
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerClassName="px-life-5 pb-[96px]"
          renderSectionHeader={({ section }) => (
            <TaskSectionHeader
              label={section.label}
              completed={section.data.filter(task => task.is_completed).length}
              total={section.data.length}
            />
          )}
          renderItem={({ item }) => (
            <View className="pb-life-3">
              <TaskListItem
                task={item}
                now={now}
                onToggleComplete={handleToggle}
                onPress={handlePress}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      <LifeFab
        accessibilityLabel={tab === 'plans' ? 'Add plan' : 'Add task'}
        onPress={tab === 'plans' ? handleAddPlan : handleAdd}
      />
    </SafeAreaView>
  );
};

export default TasksListScreen;
