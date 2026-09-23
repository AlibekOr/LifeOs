import React from 'react';
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LifeButton from '../../../shared/components/Button/LifeButton';
import LifeText from '../../../shared/components/Typography/LifeText';
import LifeInput from '../../../shared/components/Input/LifeInput.tsx';
import { LoginScreenProps } from './type.ts';
import { authService } from '../../../services/auth.service.ts';

const eyeIcon = require('../../../shared/assets/login/eye.png');
const arrowLeftIcon = require('../../../shared/assets/login/arrow-left.png');

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [isPasswordVisible, setPasswordVisible] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const handlePress = async () => {
    if (!email || !password) {
      Alert.alert('Please enter your email and password');
      return;
    }
    setLoading(true);
    const { error } = await authService.signIn(email, password);
    setLoading(false);
    if (error) {
      Alert.alert(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-between  bg-life-bg">
      {/* Header */}
      <View className="h-12 justify-center px-life-4">
        <TouchableOpacity
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          className="h-6 w-6 items-center justify-center"
        >
          <Image source={arrowLeftIcon} className="h-6 w-6" />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View className="flex-1 justify-center px-life-6">
        {/* Headline */}
        <View className="gap-life-2">
          <LifeText variant="h1" className="font-bold">
            Welcome back
          </LifeText>

          <LifeText variant="body" className="text-life-muted">
            Log in to continue your optimization journey.
          </LifeText>
        </View>

        {/* Form */}
        <View className="mt-life-8 gap-life-5">
          <LifeInput
            label="Email Address"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <LifeInput
            label="Password"
            value={password}
            secureTextEntry={!isPasswordVisible}
            placeholder="Enter your password"
            onChangeText={setPassword}
            rightElement={
              <TouchableOpacity
                accessibilityLabel="Show password"
                className="h-[18px] w-[18px]"
                onPress={() => setPasswordVisible(visible => !visible)}
              >
                <Image source={eyeIcon} className="h-[18px] w-[18px]" />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            className="items-end"
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <LifeText variant="bodySm" className="font-medium text-life-accent">
              Forgot password?
            </LifeText>
          </TouchableOpacity>
        </View>

        {/* Sign in */}
        <View className="mt-life-8 items-center">
          <LifeButton
            title={loading ? 'Loading...' : 'Sign In'}
            disabled={loading}
            onPress={handlePress}
          />
        </View>
      </View>

      {/* Footer */}
      <View className="items-center pb-life-4">
        <LifeText variant="bodySm" className="text-life-muted">
          Don't have an account?{' '}
          <LifeText
            variant="bodySm"
            className="font-semibold text-life-accent underline"
            onPress={() => navigation.navigate('Register')}
          >
            Sign up
          </LifeText>
        </LifeText>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
