import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

export default function CustomBottomTabBar() {
  const router = useRouter();
  const segments = useSegments();
  
  // Determine the active route based on segments
  // segments[0] is undefined for '/' (index)
  const activeTab = segments[0] === undefined ? 'home' : segments[0];

  const tabs = [
    { id: 'home', label: 'Ana Sayfa', emoji: '🏠', path: '/' },
    { id: 'quests', label: 'Görevler', emoji: '🎯', path: '/quests' },
    { id: 'feed', label: 'Akış', emoji: '💬', path: '/feed' },
    { id: 'leaderboard', label: 'Sıralama', emoji: '🏆', path: '/leaderboard' },
    { id: 'journey', label: 'Rozetler', emoji: '🗺️', path: '/journey' },
  ];

  const handlePress = (path: string) => {
    router.replace(path as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'home' && activeTab === 'index');
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => handlePress(tab.path)}
              activeOpacity={0.7}
            >
              <Text style={[styles.emoji, isActive && styles.activeEmoji]}>
                {tab.emoji}
              </Text>
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 236, 248, 0.8)',
    width: '100%',
    maxWidth: 500,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    opacity: 0.6,
    marginBottom: 2,
  },
  activeEmoji: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#767586',
    fontFamily: 'Inter',
  },
  activeLabel: {
    color: '#4648d4',
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4648d4',
    marginTop: 3,
  },
});
