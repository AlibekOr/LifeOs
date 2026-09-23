import { useState } from 'react';
import { Alert, Image, TouchableOpacity, View } from 'react-native';
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
    <SafeAreaView className={'flex-1 bg-life-bg justify-around pt-3 gap-2'}>
      <View className={'items-center gap-4 h-1/4'}>
        <View>
          <Image source={welcomeAuthIcon} />
        </View>
        <View>
          <LifeText variant={'h1'} className={'font-bold'}>
            LifeOS
          </LifeText>
        </View>
        <View>
          <LifeText variant={'bodySm'} color={'text-life-muted'}>
            Your intelligent life operating system
          </LifeText>
        </View>
      </View>
      <View className={'items-center h-[320px] justify-around '}>
        <View>
          <LifeButton
            title={`Continue with Apple`}
            onPress={() => {}}
            icon={require('../../../shared/assets/login/appleIcon.png')}
          />
        </View>
        <View>
          <LifeButton
            title={googleLoading ? 'Signing in...' : 'Continue with Google'}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            icon={require('../../../shared/assets/login/g.webp')}
          />
        </View>
        <View className={' justify-center items-center flex-row i m-5'}>
          <View className={'flex-1 h-[1px] bg-life-orLine'} />
          <LifeText
            variant={'body'}
            className={'mr-life-3 ml-life-3 text-[#8A8A8A]'}
          >
            or
          </LifeText>
          <View className={'flex-1 h-[1px] bg-life-orLine'} />
        </View>
        <View>
          <LifeButton
            onPress={() => navigation.navigate('Login')}
            title={'Sign in with email'}
          />
        </View>
      </View>
      <View className={'items-center gap-1 flex-row justify-center'}>
        <LifeText variant={'body'} color={'text-life-muted'}>
          New to LifeOS?
        </LifeText>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <LifeText color={'text-life-accent'} className={'underline'}>
            Create Account
          </LifeText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
export default WelcomeAuth;
