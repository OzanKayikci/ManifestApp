import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/config/notifications';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import CustomBottomTabBar from '@/components/CustomBottomTabBar';
import LoginScreen from './(auth)/login';
import SignupScreen from './(auth)/signup';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, user, isMock, loading, initialize } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const isAuthenticated = Boolean(session && (isMock || user));

  useEffect(() => {
    initialize();
  }, []);

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
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
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
