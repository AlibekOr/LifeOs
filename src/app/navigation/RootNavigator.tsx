import { View } from 'react-native';
import AuthNavigator from './AuthNavigator.tsx';
import MainNavigator from './MainNavigator.tsx';
import { useAuthStore } from '../../services/storage/authStore.ts';
import { useAuthListener } from '../../hooks/useAuthListener.ts';

const RootNavigator = () => {
  useAuthListener();
  const session = useAuthStore(state => state.session);
  const initialized = useAuthStore(state => state.initialized);

  if (!initialized) {
    return <View className="flex-1 bg-life-bg" />;
  }

  return session ? <MainNavigator /> : <AuthNavigator />;
};

export default RootNavigator;
