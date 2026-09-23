import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import { useAuthStore } from '../../../services/storage/authStore.ts';
import { authService } from '../../../services/auth.service.ts';
import { useProfile } from '../hooks/useProfile.ts';
import ReminderSettingsCard from '../components/ReminderSettingsCard.tsx';

const ProfileScreen = () => {
  const handleLogOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      console.error('[Profile] Sign out failed', error);
      Alert.alert('Could not log out', 'Please try again.');
    }
  };

  const user = useAuthStore(state => state.user);
  const { data: profile } = useProfile();

  const authFullName = (
    user?.user_metadata?.full_name as string | undefined
  )?.trim();
  const fullName = profile?.full_name?.trim() || authFullName;
  const firstName =
    fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-life-5 px-life-5 pb-life-10 pt-life-3"
        showsVerticalScrollIndicator={false}
      >
        <LifeText variant="h2" className="font-bold">
          Profile
        </LifeText>

        <View className="items-center gap-life-3 rounded-life-2xl border border-life-border bg-life-surface p-life-6">
          <View className="h-16 w-16 items-center justify-center rounded-full border border-life-border bg-life-bg">
            <LifeText variant="h3" className="font-semibold">
              {firstName.charAt(0).toUpperCase()}
            </LifeText>
          </View>
          <View className="items-center gap-life-1">
            <LifeText variant="body" className="font-semibold">
              {fullName ?? firstName}
            </LifeText>
            {user?.email && (
              <LifeText variant="bodySm" color="text-life-muted">
                {user.email}
              </LifeText>
            )}
          </View>
        </View>

        <ReminderSettingsCard />

        <TouchableOpacity
          accessibilityRole="button"
          className="items-center rounded-life-md border border-life-border bg-life-surface p-life-4"
          onPress={handleLogOut}
        >
          <LifeText variant="body" className="font-semibold text-life-danger">
            Log Out
          </LifeText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
