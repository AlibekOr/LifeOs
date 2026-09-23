import React, { useState } from 'react';
import { Alert, Image, StatusBar, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LifeButton from '../../../shared/components/Button/LifeButton';
import LifeInput from '../../../shared/components/Input/LifeInput';
import LifeText from '../../../shared/components/Typography/LifeText';
import { RegisterScreenProps } from './type.ts';
import { authService } from '../../../services/auth.service.ts';
import KeyboardAwareContent from '../components/KeyboardAwareContent.tsx';

const arrowLeftIcon = require('../../../shared/assets/login/arrow-left.png');
const eyeIcon = require('../../../shared/assets/login/eye.png');

type PasswordStrength = 'weak' | 'medium' | 'strong';

const strengthConfig: Record<
  PasswordStrength,
  {
    label: string;
    barColor: string;
    textColor: 'text-life-danger' | 'text-life-warning' | 'text-life-success';
    segments: number;
  }
> = {
  weak: {
    label: 'Weak password',
    barColor: 'bg-life-danger',
    textColor: 'text-life-danger',
    segments: 1,
  },
  medium: {
    label: 'Medium password',
    barColor: 'bg-life-warning',
    textColor: 'text-life-warning',
    segments: 2,
  },
  strong: {
    label: 'Strong password',
    barColor: 'bg-life-success',
    textColor: 'text-life-success',
    segments: 3,
  },
};

function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) {
    return null;
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9\W]/.test(password);
  const score = [
    password.length >= 8,
    hasLower && hasUpper,
    hasNumberOrSymbol,
  ].filter(Boolean).length;
  if (password.length < 6 || score <= 1) {
    return 'weak';
  }
  if (score === 2) {
    return 'medium';
  }
  return 'strong';
}

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const passwordStrength = getPasswordStrength(password);
  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { data, error } = await authService.signUp(
      email.trim(),
      password,
      fullName.trim(),
    );
    setLoading(false);
    if (error) {
      Alert.alert(error);
      return;
    }
    setPassword('');
    setFullName('');
    setEmail('');
    // With email confirmation enabled, Supabase returns no session yet —
    // RootNavigator will switch to Main automatically once the user is confirmed and signs in.
    if (!data?.session) {
      Alert.alert('Check your email to confirm your account.');
      navigation.navigate('Login');
    }
  };
  return (
    <SafeAreaView className="flex-1 justify-between bg-life-bg">
      <StatusBar barStyle="light-content" backgroundColor="#09090C" />
      <View className="h-12 justify-center px-life-4">
        <TouchableOpacity
          accessibilityLabel="Go back"
          className="h-6 w-6 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Image source={arrowLeftIcon} className="h-6 w-6" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareContent>
        <View className="gap-life-2">
          <LifeText variant="h1" className="font-bold">
            Create account
          </LifeText>
          <LifeText variant="body" className="text-life-muted">
            Step into an organized life.
          </LifeText>
        </View>

        <View className="mt-life-8 gap-life-5">
          <LifeInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
          <LifeInput
            label="Email Address"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
          />
          <View>
            <LifeInput
              label="Password"
              value={password}
              secureTextEntry={!isPasswordVisible}
              onChangeText={setPassword}
              rightElement={
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPasswordVisible ? 'Hide password' : 'Show password'
                  }
                  className="h-[18px] w-[18px]"
                  onPress={() => setPasswordVisible(visible => !visible)}
                >
                  <Image source={eyeIcon} className="h-[18px] w-[18px]" />
                </TouchableOpacity>
              }
            />
            {passwordStrength && (
              <View className="mt-life-2 gap-life-1">
                <View className="flex-row gap-life-1">
                  {[0, 1, 2].map(segmentIndex => (
                    <View
                      key={segmentIndex}
                      className={`h-1 flex-1 rounded-full ${
                        segmentIndex < strengthConfig[passwordStrength].segments
                          ? strengthConfig[passwordStrength].barColor
                          : 'bg-life-border'
                      }`}
                    />
                  ))}
                </View>
                <LifeText
                  variant="caption"
                  color={strengthConfig[passwordStrength].textColor}
                >
                  {strengthConfig[passwordStrength].label}
                </LifeText>
              </View>
            )}
          </View>
        </View>

        <View className="mt-life-8 gap-life-8">
          <LifeButton
            title={loading ? 'Loading...' : 'Create Account'}
            onPress={handleSignUp}
            disabled={loading}
          />
          <LifeText
            variant="caption"
            className="px-life-4 text-center text-life-subtle"
          >
            By continuing, you agree to our{' '}
            <LifeText variant="caption" className="text-life-muted underline">
              Terms of Service
            </LifeText>{' '}
            and{' '}
            <LifeText variant="caption" className="text-life-muted underline">
              Privacy Policy
            </LifeText>
            .
          </LifeText>
        </View>
      </KeyboardAwareContent>

      <View className="items-center pb-life-4">
        <LifeText variant="bodySm" className="text-life-muted">
          Already have an account?{' '}
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

export default RegisterScreen;
