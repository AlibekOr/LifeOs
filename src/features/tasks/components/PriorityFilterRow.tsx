import LifePills from '../../../shared/components/Pills/LifePills.tsx';
import type { TaskFilterPriority } from '../../../types/task.types.ts';

type PriorityFilterRowProps = {
  value: TaskFilterPriority;
  onChange: (value: TaskFilterPriority) => void;
};

const FILTER_OPTIONS: TaskFilterPriority[] = ['All', 'High', 'Medium', 'Low'];

const PriorityFilterRow = ({ value, onChange }: PriorityFilterRowProps) => (
  <LifePills options={FILTER_OPTIONS} value={value} onChange={onChange} />
);

export default PriorityFilterRow;
