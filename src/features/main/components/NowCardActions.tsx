import { View } from 'react-native';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import type { DisplayTask } from '../../../types/pendingSync.types.ts';
import {
  EXTEND_MINUTES,
  type NowCardAction,
} from '../hooks/useNowCardActions.ts';

const savingOr = (
  pendingAction: NowCardAction | null,
  action: NowCardAction,
  title: string,
) => (pendingAction === action ? 'Saving…' : title);

type CurrentActionsProps = {
  task: DisplayTask;
  pendingAction: NowCardAction | null;
  onComplete: (task: DisplayTask) => void;
  onExtend: (task: DisplayTask) => void;
};

// Shared by the card and the full screen view, so both behave the same.
export const CurrentActions = ({
  task,
  pendingAction,
  onComplete,
  onExtend,
}: CurrentActionsProps) => (
  <View className="flex-row gap-life-3">
    <LifeButton
      title={savingOr(pendingAction, 'complete', 'Complete')}
      accessibilityLabel={`Complete task: ${task.title}`}
      widthClassName="flex-1"
      disabled={pendingAction !== null}
      onPress={() => onComplete(task)}
    />
    <LifeButton
      variant="secondary"
      title={savingOr(pendingAction, 'extend', `+${EXTEND_MINUTES} min`)}
      accessibilityLabel={`Add ${EXTEND_MINUTES} minutes to ${task.title}`}
      widthClassName="flex-1"
      disabled={pendingAction !== null}
      onPress={() => onExtend(task)}
    />
  </View>
);

type StartActionProps = {
  task: DisplayTask;
  // The scheduled time has come, so Start is the main action.
  isDue: boolean;
  pendingAction: NowCardAction | null;
  onStart: (task: DisplayTask) => void;
};

export const StartAction = ({
  task,
  isDue,
  pendingAction,
  onStart,
}: StartActionProps) => (
  <LifeButton
    fullWidth
    variant={isDue ? 'primary' : 'secondary'}
    title={savingOr(pendingAction, 'start', 'Start')}
    accessibilityLabel={`Start task: ${task.title}`}
    disabled={pendingAction !== null}
    onPress={() => onStart(task)}
  />
);
