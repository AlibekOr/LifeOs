/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/app/navigation/RootNavigator.tsx';
import { navigationRef } from './src/app/navigation/navigationRef.ts';
import QueryProvider from './src/app/providers/QueryProvider.tsx';
import { StatusBar } from 'react-native';
import 'react-native-url-polyfill/auto';

function App() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar barStyle="light-content" backgroundColor="#09090C" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryProvider>
  );
}

export default App;
