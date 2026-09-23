import { View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';

type TaskSectionHeaderProps = {
  label: string;
  count?: number;
};

const TaskSectionHeader = ({ label, count }: TaskSectionHeaderProps) => (
  <View className="flex-row items-center justify-between bg-life-bg pb-life-2 pt-life-4">
    <LifeText variant="h3" className="font-bold">
      {label}
    </LifeText>
    {typeof count === 'number' && (
      <LifeText variant="bodySm" color="text-life-muted">
        {count}
      </LifeText>
    )}
  </View>
);

export default TaskSectionHeader;
