import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/config/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import CustomBottomTabBar from '@/components/CustomBottomTabBar';
import LoginScreen from './(auth)/login';
import SignupScreen from './(auth)/signup';
import OnboardingScreen from './onboarding';

const ONBOARDING_DONE_KEY = 'onboarding_completed';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, user, isMock, loading, initialize } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const isAuthenticated = Boolean(session && (isMock || user));

  useEffect(() => {
    initialize();
  }, []);

  // Check onboarding state when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((val) => {
        setOnboardingDone(val === 'true');
      });
    } else {
      setOnboardingDone(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (session) {
      registerForPushNotificationsAsync();

      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification clicked by user:', response);
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }
  }, [session]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#1b1b23' : '#fcf8ff' }}>
        <ActivityIndicator size="large" color="#4648d4" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {showSignup ? (
          <SignupScreen onNavigateToLogin={() => setShowSignup(false)} />
        ) : (
          <LoginScreen onNavigateToSignup={() => setShowSignup(true)} />
        )}
      </ThemeProvider>
    );
  }

  // Show loading indicator while checking onboarding state
  if (onboardingDone === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf8ff' }}>
        <ActivityIndicator size="large" color="#4648d4" />
      </View>
    );
  }

  // Show onboarding if not yet done
  if (!onboardingDone) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <View style={{ flex: 1 }}>
        <Slot />
        <CustomBottomTabBar />
      </View>
    </ThemeProvider>
  );
}
