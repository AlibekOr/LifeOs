import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainTabParamList } from './types.ts';

// Lets code outside React (notification taps) navigate. Only the signed-in app
// has these routes, so callers must check isReady() and handle "no route".
export const navigationRef = createNavigationContainerRef<MainTabParamList>();
