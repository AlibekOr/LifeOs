import React, { useState } from 'react';
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LifeButton from '../../../shared/components/Button/LifeButton';
import LifeText from '../../../shared/components/Typography/LifeText';
import LifeInput from '../../../shared/components/Input/LifeInput.tsx';
import { ForgetPassScreenProps } from './type.ts';
import { authService } from '../../../services/auth.service.ts';

const arrowLeftIcon = require('../../../shared/assets/login/arrow-left.png');

const ForgotPasswordScreen = ({ navigation }: ForgetPassScreenProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Enter your email address');
      return;
    }
    setLoading(true);
    const { error } = await authService.resetPassword(email);
    setLoading(false);
    if (error) {
      Alert.alert(error);
      return;
    }
    Alert.alert('Check your email for a password reset link.');
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 justify-between bg-life-bg">
      <View className="h-12 justify-center px-life-4">
        <TouchableOpacity
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          className="h-6 w-6 items-center justify-center"
        >
          <Image source={arrowLeftIcon} className="h-6 w-6" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center px-life-6">
        <View className="gap-life-2">
          <LifeText variant="h1" className="font-bold">
            Forgot password?
          </LifeText>
          <LifeText variant="body" className="text-life-muted">
            Enter your email and we'll send you a reset link.
          </LifeText>
        </View>

        <View className="mt-life-8 gap-life-5">
          <LifeInput
            label="Email Address"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mt-life-8 items-center">
          <LifeButton
            title={loading ? 'Sending...' : 'Send Reset Link'}
            disabled={loading}
            onPress={handleReset}
          />
        </View>
      </View>

      <View className="items-center pb-life-4">
        <LifeText variant="bodySm" className="text-life-muted">
          Remembered your password?{' '}
          <LifeText
            variant="bodySm"
            className="font-semibold text-life-accent underline"
            onPress={() => navigation.navigate('Login')}
          >
            Sign in
          </LifeText>
        </LifeText>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
