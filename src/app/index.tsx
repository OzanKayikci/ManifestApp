import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { UserRepository } from '@/repositories/UserRepository';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [playerAhead, setPlayerAhead] = useState<string | null>(null);
  const [pointsDiff, setPointsDiff] = useState<number>(0);
  const [userRank, setUserRank] = useState<number>(1);

  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        const allUsers = await UserRepository.getAllUsers();
        const currentIndex = allUsers.findIndex(u => u.id === user?.id);
        if (currentIndex > 0) {
          const ahead = allUsers[currentIndex - 1];
          setPlayerAhead(ahead.username);
          setPointsDiff(ahead.points - allUsers[currentIndex].points);
          setUserRank(currentIndex + 1);
        } else {
          setPlayerAhead(null);
          setPointsDiff(0);
          setUserRank(currentIndex === 0 ? 1 : 1);
        }
      } catch (err) {
        console.error('Error loading coach data on index:', err);
      }
    };
    if (user) {
      fetchCoachData();
    }
  }, [user?.points]);

  // Dynamic Level calculation based on points
  // Each level is 200 XP for the sake of progression
  const xpPerLevel = 200;
  const level = Math.floor((user?.points || 0) / xpPerLevel) + 1;
  const currentXPInLevel = (user?.points || 0) % xpPerLevel;
  const progressPercent = Math.min(Math.max(Math.round((currentXPInLevel / xpPerLevel) * 100), 0), 100);

  // Emojis mapping for categories
  const categories = [
    { name: 'Mutfak', emoji: '🍳', bg: '#ffe16d', color: '#221b00' },
    { name: 'Stok', emoji: '📦', bg: '#e9ddff', color: '#23005c' },
    { name: 'Gün Başı', emoji: '☀️', bg: '#e1e0ff', color: '#07006c' },
    { name: 'Gün Sonu', emoji: '🌙', bg: '#ffdad6', color: '#ba1a1a' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <Pressable style={styles.avatarContainer} onPress={() => router.push('/profile')}>
              <Image
                style={styles.avatar}
                source={{ uri: UserRepository.getUserAvatar(user?.username || '') }}
              />
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>LVL {level}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.profileTextContainer} onPress={() => router.push('/profile')}>
              <Text style={styles.welcomeText}>İyi Günler,</Text>
              <Text style={styles.userName}>{user?.username || 'Gezgin'}</Text>
            </Pressable>
          </View>
          
          <View style={styles.pointsBadgeContainer}>
            <LinearGradient
              colors={['#4648d4', '#6063ee']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pointsBadge}
            >
              <Text style={styles.pointsEmoji}>⭐️</Text>
              <Text style={styles.pointsText}>{user?.points || 0} XP</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.sectionSubtitle}>Genel Durum</Text>
            <Text style={styles.sectionTitle}>Dashboard</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>15 Gün Streak</Text>
          </View>
        </View>

        {/* Featured Hero Quest Card */}
        <LinearGradient
          colors={['#4648d4', '#6b38d4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroCardHeader}>
            <View style={styles.activeQuestTag}>
              <Text style={styles.activeQuestTagText}>AKTİF KAHRAMAN GÖREVİ</Text>
            </View>
            <View style={styles.questXPBadge}>
              <Text style={styles.questXPText}>+50 XP</Text>
            </View>
          </View>
          
          <Text style={styles.heroCardTitle}>Kahve Bilgesi</Text>
          <Text style={styles.heroCardDescription}>
            Ofisin kahve çekirdeği stokları tükenmek üzere. Kahramanımız ol ve mutfak dolaplarındaki yeni paketleri restokla!
          </Text>

          <Pressable 
            style={({ pressed }) => [styles.heroCardButton, pressed && styles.heroCardButtonPressed]}
            onPress={() => router.replace('/quests')}
          >
            <Text style={styles.heroCardButtonText}>Göreve Başla</Text>
            <Text style={styles.heroCardButtonArrow}>➡️</Text>
          </Pressable>
        </LinearGradient>

        {/* Stats Grid: Level Progress & Coach */}
        <View style={styles.statsGrid}>
          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressCardLeft}>
              <Text style={styles.cardSubtitle}>SONRAKİ SEVİYE</Text>
              <Text style={styles.cardTitle}>Seviye {level + 1}</Text>
              <Text style={styles.progressXPText}>{currentXPInLevel} / {xpPerLevel} XP</Text>
            </View>
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircleBackground}>
                {/* Visual indicator using simple circular style */}
                <Text style={styles.progressCircleText}>{progressPercent}%</Text>
              </View>
            </View>
          </View>

          {/* Coach Aura Card */}
          <View style={styles.coachCard}>
            <View style={styles.coachHeader}>
              <View style={styles.coachIcon}>
                <Text style={styles.coachIconText}>✨</Text>
              </View>
              <Text style={styles.coachName}>Yapay Zeka Aura</Text>
            </View>
            <Text style={styles.coachSpeech}>
              {userRank === 1 ? (
                `"Tebrikler ${user?.username || 'Gezgin'}, şu anda sıralamada 1. sıradasınız! Liderliğinizi korumak için görev tamamlamaya devam edin!"`
              ) : playerAhead ? (
                <>
                  "Sıralamada <Text style={styles.coachSpeechHighlight}>{playerAhead}</Text> kullanıcısını geçmek için sadece <Text style={styles.coachSpeechHighlight}>{pointsDiff} XP</Text> kaldı!"
                </>
              ) : (
                `"Görevleri tamamlayarak sıralamada yükselmeye başlayabilirsiniz!"`
              )}
            </Text>
          </View>
        </View>

        {/* Quick Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesSectionTitle}>GÖREV KATEGORİLERİ</Text>
          <View style={styles.categoriesRow}>
            {categories.map((cat, idx) => (
              <Pressable 
                key={idx} 
                style={styles.categoryItem}
                onPress={() => router.replace('/quests')}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.bg }]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.categoryLabel}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Achievement */}
        <View style={styles.achievementCard}>
          <View style={styles.achievementBadge}>
            <Text style={styles.achievementEmoji}>⚡️</Text>
            <View style={styles.newBadgeLabel}>
              <Text style={styles.newBadgeLabelText}>YENİ</Text>
            </View>
          </View>
          <View style={styles.achievementTextContainer}>
            <Text style={styles.achievementHeaderLabel}>Son Başarı Rozeti</Text>
            <Text style={styles.achievementTitle}>Hız Canavarı</Text>
            <Text style={styles.achievementDesc}>Bir saat içinde 5 görev tamamlandı.</Text>
          </View>
          <Text style={styles.achievementArrow}>➡️</Text>
        </View>

        {/* Logout Button */}
        <Pressable 
          style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
          onPress={() => signOut()}
        >
          <Text style={styles.signOutButtonText}>Oturumu Kapat</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8ff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120, // Leave room for bottom bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4648d4',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#ffe16d',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  levelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#221b00',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  profileTextContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 12,
    color: '#767586',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1b23',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  pointsBadgeContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pointsEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#767586',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1b1b23',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 94, 40, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 40, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#eb5e28',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeQuestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeQuestTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  questXPBadge: {
    backgroundColor: '#705d00',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  questXPText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  heroCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  heroCardButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroCardButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  heroCardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4648d4',
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  heroCardButtonArrow: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#efecf8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(70, 72, 212, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCardLeft: {
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#767586',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b1b23',
    marginVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  progressXPText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4648d4',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  progressCircleContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#4648d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1b1b23',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  coachCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(107, 56, 212, 0.1)',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e9ddff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  coachIconText: {
    fontSize: 10,
  },
  coachName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b38d4',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  coachSpeech: {
    fontSize: 12,
    color: '#1b1b23',
    fontStyle: 'italic',
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  coachSpeechHighlight: {
    fontWeight: '700',
    color: '#6b38d4',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#767586',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1b1b23',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 20,
  },
  achievementBadge: {
    width: 48,
    height: 48,
    backgroundColor: '#ffe16d',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    transform: [{ rotate: '3deg' }],
  },
  achievementEmoji: {
    fontSize: 24,
  },
  newBadgeLabel: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1b1b23',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  newBadgeLabelText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#ffffff',
  },
  achievementTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  achievementHeaderLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#767586',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b1b23',
    marginVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  achievementDesc: {
    fontSize: 11,
    color: '#767586',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  achievementArrow: {
    fontSize: 14,
    color: '#767586',
  },
  signOutButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(235, 94, 40, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 40, 0.15)',
    marginTop: 10,
    marginBottom: 20,
  },
  signOutButtonPressed: {
    opacity: 0.8,
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#eb5e28',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});
