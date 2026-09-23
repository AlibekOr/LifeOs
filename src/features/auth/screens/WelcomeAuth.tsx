import { useState } from 'react';
import { Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import { WelcomeScreenProps } from './type.ts';
import { authService } from '../../../services/auth.service.ts';
const welcomeAuthIcon = require('../../../shared/assets/login/welcomeAuth.png');

function WelcomeAuth({ navigation }: WelcomeScreenProps) {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await authService.signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      Alert.alert(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg">
      {/* Scrolls on short screens instead of clipping; spreads out on tall ones. */}
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow justify-between gap-life-6 px-life-6 py-life-6"
      >
        <View className="items-center gap-life-4 pt-life-6">
          <Image source={welcomeAuthIcon} />
          <LifeText variant="h1" className="font-bold">
            LifeOS
          </LifeText>
          <LifeText variant="bodySm" color="text-life-muted">
            Your intelligent life operating system
          </LifeText>
        </View>

        <View className="w-full items-center gap-life-4">
          <LifeButton
            title="Continue with Apple"
            onPress={() => {}}
            icon={require('../../../shared/assets/login/appleIcon.png')}
          />
          <LifeButton
            title={googleLoading ? 'Signing in...' : 'Continue with Google'}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            icon={require('../../../shared/assets/login/g.webp')}
          />
          <View className="w-full max-w-[362px] flex-row items-center py-life-2">
            <View className="h-[1px] flex-1 bg-life-orLine" />
            <LifeText
              variant="body"
              color="text-life-muted"
              className="mx-life-3"
            >
              or
            </LifeText>
            <View className="h-[1px] flex-1 bg-life-orLine" />
          </View>
          <LifeButton
            onPress={() => navigation.navigate('Login')}
            title="Sign in with email"
          />
        </View>

        <View className="flex-row items-center justify-center gap-life-1">
          <LifeText variant="body" color="text-life-muted">
            New to LifeOS?
          </LifeText>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('Register')}
          >
            <LifeText color="text-life-accent" className="underline">
              Create Account
            </LifeText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
export default WelcomeAuth;
