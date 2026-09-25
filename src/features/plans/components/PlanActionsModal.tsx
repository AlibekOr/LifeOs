import LifeActionSheet, {
  type LifeActionSheetAction,
} from '../../../shared/components/ActionSheet/LifeActionSheet.tsx';
import type { DisplayPlan } from '../../../types/pendingSync.types.ts';
import type { PlanStatus } from '../../../types/plan.types.ts';

type PlanActionsModalProps = {
  plan: DisplayPlan | null;
  onClose: () => void;
  onEdit: (plan: DisplayPlan) => void;
  onSetStatus: (plan: DisplayPlan, status: PlanStatus) => void;
  onDelete: (plan: DisplayPlan) => void;
};

function buildActions(
  plan: DisplayPlan,
  {
    onEdit,
    onSetStatus,
    onDelete,
  }: Omit<PlanActionsModalProps, 'plan' | 'onClose'>,
): LifeActionSheetAction[] {
  const actions: LifeActionSheetAction[] = [];
  if (plan.status === 'planned') {
    actions.push({
      label: 'Mark as done',
      onPress: () => onSetStatus(plan, 'done'),
    });
  } else {
    actions.push({
      label: 'Mark as planned',
      onPress: () => onSetStatus(plan, 'planned'),
    });
  }
  if (plan.status !== 'cancelled') {
    actions.push({
      label: 'Cancel plan',
      onPress: () => onSetStatus(plan, 'cancelled'),
    });
  }
  actions.push({ label: 'Edit', onPress: () => onEdit(plan) });
  actions.push({
    label: 'Delete',
    danger: true,
    onPress: () => onDelete(plan),
  });
  return actions;
}

const PlanActionsModal = ({
  plan,
  onClose,
  onEdit,
  onSetStatus,
  onDelete,
}: PlanActionsModalProps) => (
  <LifeActionSheet
    visible={plan !== null}
    title={plan?.title ?? ''}
    actions={plan ? buildActions(plan, { onEdit, onSetStatus, onDelete }) : []}
    onClose={onClose}
  />
);

export default PlanActionsModal;
