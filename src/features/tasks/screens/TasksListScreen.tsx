import { useMemo, useState } from 'react';
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
import TaskListItem from '../components/TaskListItem.tsx';
import TaskSectionHeader from '../components/TaskSectionHeader.tsx';
import PriorityFilterRow from '../components/PriorityFilterRow.tsx';
import SyncStatusBanner from '../../main/components/SyncStatusBanner.tsx';
import { useToggleTaskCompletion } from '../hooks/useTasks.ts';
import { useTasksWithPending } from '../hooks/useTasksWithPending.ts';
import { usePendingSyncStore } from '../../../store/pendingSync.store.ts';
import { groupTasksByDate } from '../utils/groupTasksByDate.ts';
import type { TaskFilterPriority } from '../../../types/task.types.ts';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import type { TasksListScreenProps } from './type.ts';

const TasksListScreen = ({ navigation }: TasksListScreenProps) => {
  const [priorityFilter, setPriorityFilter] =
    useState<TaskFilterPriority>('All');
  const { tasks, isLoading, isError, error, refetch, isRefetching } =
    useTasksWithPending();
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

  const sections = useMemo(
    () => groupTasksByDate(filteredTasks),
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

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <View className="gap-life-4 px-life-5 pb-life-3 pt-life-3">
        <LifeText variant="h2" className="font-bold">
          Tasks
        </LifeText>
        <PriorityFilterRow
          value={priorityFilter}
          onChange={setPriorityFilter}
        />
        <SyncStatusBanner />
      </View>

      {isLoading ? (
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
              count={section.data.length}
            />
          )}
          renderItem={({ item }) => (
            <View className="pb-life-3">
              <TaskListItem
                task={item}
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
      <LifeFab accessibilityLabel="Add task" onPress={handleAdd} />
    </SafeAreaView>
  );
};

export default TasksListScreen;
