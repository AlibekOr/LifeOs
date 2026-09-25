import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

// Options for full-screen forms (task, plan, goal). On iOS they rise natively
// over everything, the tab bar included, so the bar hiding underneath is never
// seen. On Android a fade with a small rise is smoother than a full-screen slide.
export const formScreenOptions: NativeStackNavigationOptions =
  Platform.OS === 'ios'
    ? {
        headerShown: false,
        presentation: 'fullScreenModal',
        animation: 'slide_from_bottom',
      }
    : { headerShown: false, animation: 'fade_from_bottom' };
