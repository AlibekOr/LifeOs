import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';

type ComingSoonViewProps = {
  title: string;
};

const ComingSoonView = ({ title }: ComingSoonViewProps) => (
  <SafeAreaView className="flex-1 items-center justify-center gap-life-2 bg-life-bg">
    <LifeText variant="h2" className="font-bold">
      {title}
    </LifeText>
    <LifeText variant="body" color="text-life-muted">
      Coming soon
    </LifeText>
  </SafeAreaView>
);

export default ComingSoonView;
