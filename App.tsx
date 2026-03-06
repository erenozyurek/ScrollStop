/**
 * ScrollStop - AI Powered UGC Ad Generator
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { VideoJobsProvider } from './src/context/VideoJobsContext';

function App() {
  return (
    <AuthProvider>
      <VideoJobsProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <AppNavigator />
        </SafeAreaProvider>
      </VideoJobsProvider>
    </AuthProvider>
  );
}

export default App;
