import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

interface LeaderboardUser {
  name: string;
  points: number;
  team: string;
  avatar: string;
  isCurrentUser: boolean;
  todayXP: number;
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Dynamic Level calculation
  const xpPerLevel = 200;
  const level = Math.floor((user?.points || 0) / xpPerLevel) + 1;

  // Base competitors list
  const initialCompetitors: LeaderboardUser[] = [
    { name: 'Ahmet L.', points: 1420, team: 'Yazılım', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isCurrentUser: false, todayXP: 45 },
    { name: 'Sarah K.', points: 1265, team: 'Tasarım', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isCurrentUser: false, todayXP: 60 },
    { name: 'Elena R.', points: 1120, team: 'İK', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', isCurrentUser: false, todayXP: 20 },
    { name: 'Can D.', points: 850, team: 'Pazarlama', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', isCurrentUser: false, todayXP: 30 },
  ];

  // Inject current user dynamically based on their current points from store
  const userPoints = user?.points || 120;
  const currentUser: LeaderboardUser = {
    name: `Sen (${user?.username || 'Gezgin'})`,
    points: userPoints,
    team: 'Tasarım',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isCurrentUser: true,
    todayXP: userPoints > 120 ? userPoints - 120 : 0
  };

  // Merge lists and sort by points descending
  const allPlayers = [...initialCompetitors, currentUser].sort((a, b) => b.points - a.points);

  // Find ranks
  const userRankIndex = allPlayers.findIndex(p => p.isCurrentUser);
  const userRank = userRankIndex + 1;

  // Find player ahead of user
  const playerAhead = userRankIndex > 0 ? allPlayers[userRankIndex - 1] : null;
  const pointsDifference = playerAhead ? (playerAhead.points - userPoints) : 0;
  
  // Calculate progress to overtake the player ahead
  const overtakeProgress = playerAhead 
    ? Math.max(0, Math.min(100, Math.round(((playerAhead.points - pointsDifference) / playerAhead.points) * 100))) 
    : 100;

  // Split top 3 and the rest
  const top3 = allPlayers.slice(0, 3);
  const remaining = allPlayers.slice(3);

  // Reorder top 3 for the podium display: Rank 2 on Left, Rank 1 in Center, Rank 3 on Right
  const podium = [
    top3[1] || null, // Rank 2
    top3[0] || null, // Rank 1
    top3[2] || null, // Rank 3
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Sıralama</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LVL {level}</Text>
          </View>
        </View>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsEmoji}>⭐️</Text>
          <Text style={styles.pointsText}>{userPoints} XP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable 
            style={[styles.tabButton, activeTab === 'daily' && styles.tabButtonActive]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>Günlük</Text>
          </Pressable>
          <Pressable 
            style={[styles.tabButton, activeTab === 'weekly' && styles.tabButtonActive]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>Haftalık</Text>
          </Pressable>
          <Pressable 
            style={[styles.tabButton, activeTab === 'monthly' && styles.tabButtonActive]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>Aylık</Text>
          </Pressable>
        </View>

        {/* AI Coach / Target Card */}
        <View style={styles.coachCard}>
          <View style={styles.coachInfo}>
            <View style={styles.coachIcon}>
              <Text style={styles.coachIconText}>✨</Text>
            </View>
            <View style={styles.coachTextContainer}>
              <Text style={styles.coachTitle}>Yapay Zeka Aura</Text>
              {playerAhead ? (
                <Text style={styles.coachMessage}>
                  Sıralamada <Text style={styles.coachHighlight}>{playerAhead.name}</Text>'ı geçmek için sadece <Text style={styles.coachHighlight}>{pointsDifference} XP</Text> kaldı!
                </Text>
              ) : (
                <Text style={styles.coachMessage}>
                  Tebrikler! Liderlik tablosunun zirvesindesin, yerini korumak için yeni görevler yap! 🏆
                </Text>
              )}
            </View>
          </View>
          {playerAhead && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${overtakeProgress}%` }]} />
            </View>
          )}
        </View>

        {/* Podium Display (Top 3 Players) */}
        <View style={styles.podiumContainer}>
          {podium.map((player, idx) => {
            if (!player) return <View key={idx} style={styles.podiumColumnEmpty} />;
            
            // Assign index for Rank: 0 is Rank 2, 1 is Rank 1, 2 is Rank 3
            const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const isFirst = rank === 1;

            return (
              <View 
                key={player.name} 
                style={[
                  styles.podiumColumn, 
                  isFirst ? styles.podiumColumnFirst : styles.podiumColumnOther
                ]}
              >
                {/* Crown for Rank 1 */}
                {isFirst && (
                  <View style={styles.crownContainer}>
                    <Text style={styles.crownEmoji}>👑</Text>
                  </View>
                )}

                {/* Avatar with Ring */}
                <View style={styles.podiumAvatarContainer}>
                  <Image 
                    style={[
                      styles.podiumAvatar, 
                      { borderColor: rank === 1 ? '#ffe16d' : rank === 2 ? '#c7c4d7' : '#e9ddff' }
                    ]} 
                    source={{ uri: player.avatar }} 
                  />
                  <View style={[
                    styles.podiumRankBadge, 
                    { backgroundColor: rank === 1 ? '#ffe16d' : rank === 2 ? '#c7c4d7' : '#cd7f32' }
                  ]}>
                    <Text style={styles.podiumRankText}>{rank}</Text>
                  </View>
                </View>

                {/* Pedestal block */}
                <LinearGradient
                  colors={
                    rank === 1 ? ['#ffe16d', '#e9c400'] :
                    rank === 2 ? ['#efecf8', '#dbd8e4'] :
                    ['#ffdad6', '#ba1a1a']
                  }
                  style={[
                    styles.podiumPedestal, 
                    { height: rank === 1 ? 130 : rank === 2 ? 100 : 80 }
                  ]}
                >
                  <Text style={styles.podiumPlayerName} numberOfLines={1}>
                    {player.name.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumPlayerXP}>{player.points} XP</Text>
                </LinearGradient>
              </View>
            );
          })}
        </View>

        {/* Leaderboard Competitors List */}
        <View style={styles.listSection}>
          <Text style={styles.listSectionTitle}>Rakipler</Text>
          <View style={styles.competitorsList}>
            {allPlayers.map((player, idx) => {
              const rank = idx + 1;
              // Skip top 3 since they are on the podium
              if (rank <= 3) return null;

              const isUser = player.isCurrentUser;
              return (
                <View 
                  key={player.name} 
                  style={[
                    styles.competitorRow, 
                    isUser && styles.competitorRowUser
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rankText, isUser && styles.rankTextUser]}>{rank}</Text>
                    <Image style={styles.rowAvatar} source={{ uri: player.avatar }} />
                    <View>
                      <Text style={[styles.playerName, isUser && styles.playerNameUser]}>{player.name}</Text>
                      <Text style={styles.playerTeam}>{player.team}</Text>
                    </View>
                  </View>

                  <View style={styles.rowRight}>
                    <Text style={[styles.playerXP, isUser && styles.playerXPUser]}>{player.points} XP</Text>
                    {player.todayXP > 0 && (
                      <Text style={styles.playerTodayXP}>+{player.todayXP} bugün</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4648d4',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  levelBadge: {
    backgroundColor: '#ffe16d',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#221b00',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(70, 72, 212, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(70, 72, 212, 0.15)',
  },
  pointsEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4648d4',
  },
  scrollContent: {
    paddingBottom: 140,
    paddingHorizontal: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#efecf8',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767586',
  },
  tabTextActive: {
    color: '#4648d4',
    fontWeight: '700',
  },
  coachCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(70, 72, 212, 0.1)',
    marginBottom: 24,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  coachInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coachIcon: {
    backgroundColor: 'rgba(70, 72, 212, 0.1)',
    borderRadius: 12,
    padding: 10,
  },
  coachIconText: {
    fontSize: 20,
  },
  coachTextContainer: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b1b23',
    marginBottom: 2,
  },
  coachMessage: {
    fontSize: 12,
    color: '#767586',
    lineHeight: 16,
  },
  coachHighlight: {
    fontWeight: '800',
    color: '#4648d4',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#efecf8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4648d4',
    borderRadius: 4,
  },

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'end',
    justifyContent: 'center',
    gap: 10,
    height: 250,
    marginBottom: 28,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 100,
  },
  podiumColumnFirst: {
    maxWidth: 110,
    transform: [{ scale: 1.05 }],
  },
  podiumColumnOther: {},
  podiumColumnEmpty: {
    flex: 1,
    maxWidth: 100,
  },
  crownContainer: {
    marginBottom: -2,
    zIndex: 2,
  },
  crownEmoji: {
    fontSize: 24,
  },
  podiumAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
    zIndex: 1,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  podiumRankText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1b1b23',
  },
  podiumPedestal: {
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 4,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  podiumPlayerName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  podiumPlayerXP: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Competitors List
  listSection: {
    marginBottom: 20,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#767586',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  competitorsList: {
    gap: 12,
  },
  competitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  competitorRowUser: {
    backgroundColor: 'rgba(70, 72, 212, 0.08)',
    borderColor: 'rgba(70, 72, 212, 0.2)',
    borderWidth: 1.5,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#767586',
    width: 20,
    textAlign: 'center',
  },
  rankTextUser: {
    color: '#4648d4',
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b1b23',
  },
  playerNameUser: {
    color: '#4648d4',
  },
  playerTeam: {
    fontSize: 10,
    color: '#767586',
    fontWeight: '500',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  playerXP: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1b1b23',
  },
  playerXPUser: {
    color: '#4648d4',
  },
  playerTodayXP: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4caf50',
    marginTop: 2,
  },
});
