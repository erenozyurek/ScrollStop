import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { RootStackParamList } from './types';

// Auth Screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';

// Main Tabs
import { MainTabs } from './MainTabs';

// Stack Screens
import { CreateAdScreen } from '../screens/create/CreateAdScreen';
import { GeneratingScreen } from '../screens/create/GeneratingScreen';
import { PreviewScreen } from '../screens/preview/PreviewScreen';
import { PricingScreen } from '../screens/pricing/PricingScreen';
import { ProjectsScreen } from '../screens/projects/ProjectsScreen';
import { CaptionGeneratorScreen } from '../screens/create/CaptionGeneratorScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.white,
          background: Colors.background,
          card: Colors.surface,
          text: Colors.textPrimary,
          border: Colors.border,
          notification: Colors.white,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '800',
          },
        },
      }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}>
        {/* Auth Flow */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Main App */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Create Flow */}
        <Stack.Screen
          name="CreateAd"
          component={CreateAdScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Generating"
          component={GeneratingScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="Projects" component={ProjectsScreen} />
        <Stack.Screen
          name="CaptionGenerator"
          component={CaptionGeneratorScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* Other */}
        <Stack.Screen
          name="Pricing"
          component={PricingScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
