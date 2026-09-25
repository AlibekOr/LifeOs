import LifeActionSheet from '../../../shared/components/ActionSheet/LifeActionSheet.tsx';

type AddActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onAddPlan: () => void;
  onAddTask: () => void;
  onAddFinance: () => void;
};

// Home's "+" button: which kind of thing is being added.
const AddActionSheet = ({
  visible,
  onClose,
  onAddPlan,
  onAddTask,
  onAddFinance,
}: AddActionSheetProps) => {
  const choose = (open: () => void) => () => {
    onClose();
    open();
  };

  return (
    <LifeActionSheet
      visible={visible}
      title="What do you want to add?"
      onClose={onClose}
      actions={[
        {
          label: 'Plan',
          description: 'A place or event on a date',
          onPress: choose(onAddPlan),
        },
        {
          label: 'Task',
          description: 'Something to do, with a time and duration',
          onPress: choose(onAddTask),
        },
        {
          label: 'Finance',
          description: 'An expense or income',
          onPress: choose(onAddFinance),
        },
      ]}
    />
  );
};

export default AddActionSheet;
