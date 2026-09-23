import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import OnboardingIllustration from '../components/OnboardingIllustration.tsx';
import type { OnboardingIllustrationVariant } from '../components/OnboardingIllustration.tsx';
import { OnboardingScreenProps } from './type.ts';

type OnboardingStep = {
  illustration: OnboardingIllustrationVariant;
  title: string;
  subtitle: string;
  buttonLabel: string;
};

const steps: OnboardingStep[] = [
  {
    illustration: 0,
    title: 'Your life, organized',
    subtitle:
      'Manage goals, tasks, habits, finances, and learning — all in one place.',
    buttonLabel: 'Next',
  },
  {
    illustration: 1,
    title: 'AI plans your day',
    subtitle:
      'Tell LifeOS what you need to do, and it creates the perfect schedule.',
    buttonLabel: 'Next',
  },
  {
    illustration: 2,
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

  const handleSkip = () => {
    navigation.replace('WelcomeAuth');
  };

  const handleNext = () => {
    if (isLast) {
      navigation.replace('WelcomeAuth');
      return;
    }
    setStep(prev => prev + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg px-life-5">
      <View className="flex-row items-center justify-between py-life-3">
        <View className="w-16" />
        <View className="rounded-full border border-life-border px-life-4 py-life-1">
          <LifeText variant="caption" color="text-life-muted">
            LIFEOS
          </LifeText>
        </View>
        <View className="w-16 items-end">
          {!isLast ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Skip introduction"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={handleSkip}
            >
              <LifeText
                variant="bodySm"
                color="text-life-accent"
                className="font-semibold"
              >
                Skip
              </LifeText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View className="flex-1 justify-center gap-life-8">
        <View className="aspect-[1.3] w-full overflow-hidden rounded-life-2xl border border-life-border bg-life-surface">
          <OnboardingIllustration variant={current.illustration} />
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

      <View
        accessible
        accessibilityLabel={`Step ${step + 1} of ${steps.length}`}
        className="mb-life-6 flex-row items-center justify-center gap-life-2"
      >
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
