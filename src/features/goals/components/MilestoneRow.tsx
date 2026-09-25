import { View } from 'react-native';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeProgressBar from '../../../shared/components/ProgressBar/LifeProgressBar.tsx';
import type { Progress } from '../utils/goalProgress.ts';

type MilestoneRowProps = {
  title: string;
  progress: Progress;
};

const MilestoneRow = ({ title, progress }: MilestoneRowProps) => (
  <View
    accessible
    accessibilityLabel={`${title}, ${progress.percent} percent`}
    className="gap-life-2 rounded-life-lg border border-life-border bg-life-surface p-life-4"
  >
    <View className="flex-row items-center justify-between gap-life-3">
      <LifeText
        variant="body"
        className="flex-1 font-semibold"
        numberOfLines={2}
      >
        {title}
      </LifeText>
      <LifeText
        variant="bodySm"
        color="text-life-accent"
        className="font-semibold"
      >
        {progress.percent}%
      </LifeText>
    </View>
    <LifeProgressBar percent={progress.percent} />
    <LifeText variant="caption" color="text-life-muted">
      {progress.total > 0
        ? `${progress.completed} of ${progress.total} tasks done`
        : 'No tasks linked yet'}
    </LifeText>
  </View>
);

export default MilestoneRow;
