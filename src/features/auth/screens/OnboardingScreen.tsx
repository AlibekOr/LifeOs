import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import { OnboardingScreenProps } from './type.ts';

type OnboardingStep = {
  title: string;
  subtitle: string;
  buttonLabel: string;
};

const steps: OnboardingStep[] = [
  {
    title: 'Your life, organized',
    subtitle:
      'Manage goals, tasks, habits, finances, and learning — all in one place.',
    buttonLabel: 'Next',
  },
  {
    title: 'AI plans your day',
    subtitle:
      'Tell LifeOS what you need to do, and it creates the perfect schedule.',
    buttonLabel: 'Next',
  },
  {
    title: 'Understand your progress',
    subtitle:
      'Track every dimension of your life with beautiful insights and analytics.',
    buttonLabel: 'Get Started',
  },
];

function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigation.replace('WelcomeAuth');
      return;
    }
    setStep(prev => prev + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg px-life-5">
      <View className="items-center py-life-3">
        <View className="px-life-4 py-life-1 rounded-full border border-life-border">
          <LifeText variant="caption" color="text-life-muted">
            LIFEOS
          </LifeText>
        </View>
      </View>

      <View className="flex-1 justify-center gap-life-8">
        <View className="h-[340px] rounded-life-2xl bg-life-surface border border-life-border items-center justify-center overflow-hidden">
          <View
            className="h-40 w-40 rounded-full bg-life-primary"
            style={{ opacity: 0.25 }}
          />
        </View>

        <View className="items-center gap-life-3">
          <LifeText variant="h1" className="font-bold text-center">
            {current.title}
          </LifeText>
          <LifeText
            variant="body"
            color="text-life-muted"
            className="text-center"
          >
            {current.subtitle}
          </LifeText>
        </View>
      </View>

      <View className="flex-row justify-center items-center gap-life-2 mb-life-6">
        {steps.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full ${
              index === step ? 'w-6 bg-life-primary' : 'w-2 bg-life-border'
            }`}
          />
        ))}
      </View>

      <View className="items-center mb-life-5">
        <LifeButton title={current.buttonLabel} onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

export default OnboardingScreen;
