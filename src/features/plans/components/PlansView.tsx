import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  TouchableOpacity,
  View,
} from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import { MINUTE_MS, useNow } from '../../../hooks/useNow.ts';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus.ts';
import { PlanOverlapError } from '../../../services/plan.service.ts';
import { usePendingSyncStore } from '../../../store/pendingSync.store.ts';
import type { DisplayPlan } from '../../../types/pendingSync.types.ts';
import type { PlanStatus } from '../../../types/plan.types.ts';
import {
  useDeletePlan,
  usePlans,
  useSetPlanStatus,
} from '../hooks/usePlans.ts';
import { usePlanRange } from '../hooks/usePlanRange.ts';
import {
  groupPlansByDate,
  type PlanListEntry,
  type PlanSection,
} from '../utils/groupPlansByDate.ts';
import PlanActionsModal from './PlanActionsModal.tsx';
import PlanListItem from './PlanListItem.tsx';
import PlanSectionHeader from './PlanSectionHeader.tsx';

type PlansViewProps = {
  onAddPlan: () => void;
  onEditPlan: (planId: string) => void;
};

const PAST_SECTION_KEY = 'past';

const PlansView = ({ onAddPlan, onEditPlan }: PlansViewProps) => {
  // Section membership (Today, Past, "Day 2 of 3") changes on minute boundaries.
  const now = useNow(MINUTE_MS);
  const range = usePlanRange();
  const { plans, isLoading, isError, error, refetch, isRefetching } =
    usePlans(range);
  const setStatus = useSetPlanStatus();
  const deletePlan = useDeletePlan();
  const { isOnline } = useNetworkStatus();
  const retryEntry = usePendingSyncStore(state => state.retryEntry);
  const discardEntry = usePendingSyncStore(state => state.discardEntry);

  const [pastExpanded, setPastExpanded] = useState(false);
  const [actionPlan, setActionPlan] = useState<DisplayPlan | null>(null);

  const grouped = useMemo(
    () => groupPlansByDate(plans ?? [], now),
    [plans, now],
  );
  const pastCount =
    grouped.find(section => section.key === PAST_SECTION_KEY)?.data.length ?? 0;
  // A collapsed Past section keeps its header but hands the list no rows.
  const sections = useMemo<PlanSection<DisplayPlan>[]>(
    () =>
      grouped.map(section =>
        section.key === PAST_SECTION_KEY && !pastExpanded
          ? { ...section, data: [] }
          : section,
      ),
    [grouped, pastExpanded],
  );

  const handleSetStatus = (plan: DisplayPlan, status: PlanStatus) => {
    setActionPlan(null);
    setStatus.mutate(
      { id: plan.id, status },
      {
        onError: err => {
          console.error(err);
          Alert.alert(
            err instanceof PlanOverlapError
              ? err.message
              : 'Could not update plan. Please try again.',
          );
        },
      },
    );
  };

  const handleDelete = (plan: DisplayPlan) => {
    setActionPlan(null);
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
        onPress: () =>
          deletePlan.mutate(plan.id, {
            onError: err => {
              console.error(err);
              Alert.alert('Could not delete plan. Please try again.');
            },
          }),
      },
    ]);
  };

  const handleEdit = (plan: DisplayPlan) => {
    setActionPlan(null);
    onEditPlan(plan.id);
  };

  const handlePress = (plan: DisplayPlan) => {
    if (plan.syncStatus !== 'failed') {
      onEditPlan(plan.id);
      return;
    }
    Alert.alert(
      'Sync failed',
      `"${plan.title}" couldn't be saved to your account. Retry, edit it, or discard your unsynced changes.`,
      [
        { text: 'Retry', onPress: () => retryEntry(plan.id) },
        { text: 'Edit', onPress: () => onEditPlan(plan.id) },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => discardEntry(plan.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="gap-life-3 px-life-5">
        <View className="gap-life-3 rounded-life-lg border border-life-border bg-life-surface p-life-4">
          <LifeText variant="bodySm" color="text-life-danger">
            {error instanceof Error ? error.message : 'Failed to load plans.'}
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
    );
  }

  if (sections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-life-5">
        <View className="w-full items-center gap-life-4 rounded-life-lg border border-life-border bg-life-surface p-life-6">
          <LifeText variant="body" className="font-semibold">
            No plans yet
          </LifeText>
          <LifeText variant="bodySm" color="text-life-muted">
            Add where you're going or what you're doing on a date.
          </LifeText>
          <LifeButton title="Add a plan" onPress={onAddPlan} fullWidth />
        </View>
      </View>
    );
  }

  return (
    <>
      <SectionList<PlanListEntry<DisplayPlan>, PlanSection<DisplayPlan>>
        sections={sections}
        keyExtractor={entry => entry.plan.id}
        contentContainerClassName="px-life-5 pb-[96px]"
        renderSectionHeader={({ section }) =>
          section.key === PAST_SECTION_KEY ? (
            <PlanSectionHeader
              label={section.label}
              count={pastCount}
              expanded={pastExpanded}
              onToggle={() => setPastExpanded(expanded => !expanded)}
            />
          ) : (
            <PlanSectionHeader label={section.label} />
          )
        }
        renderItem={({ item }) => (
          <View className="pb-life-3">
            <PlanListItem
              entry={item}
              onPress={handlePress}
              onLongPress={setActionPlan}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      />
      <PlanActionsModal
        plan={actionPlan}
        onClose={() => setActionPlan(null)}
        onEdit={handleEdit}
        onSetStatus={handleSetStatus}
        onDelete={handleDelete}
      />
    </>
  );
};

export default PlansView;
