import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, UserProfile } from '@/hooks/useAuth';
import { UserQuest, QuestRepository } from '@/repositories/QuestRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FeedScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [feed, setFeed] = useState<UserQuest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Local interaction counts to make buttons interactive
  const [reactions, setReactions] = useState<Record<string, { claps: number, fires: number, hearts: number, clicked: Record<string, boolean> }>>({});

  // Dynamic Level calculation
  const xpPerLevel = 200;
  const level = Math.floor((user?.points || 0) / xpPerLevel) + 1;

  useEffect(() => {
    loadFeed();
  }, [user?.points]); // Reload feed when points change so that new completions show up

  const loadFeed = async () => {
    setLoading(true);
    try {
      const posts = await QuestRepository.getFeed();
      setFeed(posts);

      const allUsers = await UserRepository.getAllUsers();
      setUsers(allUsers);

      const isMock = useAuth.getState().isMock;

      // Get user's clicked reactions from AsyncStorage
      let storedClicked: Record<string, Record<string, boolean>> = {};
      try {
        const storedClickedRaw = await AsyncStorage.getItem(`clicked_reactions_${user?.id}`);
        if (storedClickedRaw) {
          storedClicked = JSON.parse(storedClickedRaw);
        }
      } catch (err) {
        console.warn('Failed to load local reaction states:', err);
      }

      const initialReactions: typeof reactions = {};
      posts.forEach(post => {
        const claps = post.claps_count ?? (isMock ? Math.floor(Math.random() * 20) + 5 : 0);
        const fires = post.fires_count ?? (isMock ? Math.floor(Math.random() * 30) + 10 : 0);
        const hearts = post.hearts_count ?? (isMock ? Math.floor(Math.random() * 15) + 3 : 0);
        const postClicked = storedClicked[post.id] || { claps: false, fires: false, hearts: false };

        initialReactions[post.id] = {
          claps,
          fires,
          hearts,
          clicked: postClicked
        };
      });
      setReactions(initialReactions);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReaction = async (postId: string, type: 'claps' | 'fires' | 'hearts') => {
    const current = reactions[postId] || { claps: 0, fires: 0, hearts: 0, clicked: {} };
    const isClicked = !!current.clicked[type];
    const countDiff = isClicked ? -1 : 1;

    // Update local state instantly
    setReactions(prev => {
      const postReacts = prev[postId] || { claps: 0, fires: 0, hearts: 0, clicked: {} };
      return {
        ...prev,
        [postId]: {
          ...postReacts,
          [type]: Math.max(0, postReacts[type] + countDiff),
          clicked: {
            ...postReacts.clicked,
            [type]: !isClicked
          }
        }
      };
    });

    // Update AsyncStorage
    try {
      const storedClickedRaw = await AsyncStorage.getItem(`clicked_reactions_${user?.id}`);
      const storedClicked = storedClickedRaw ? JSON.parse(storedClickedRaw) : {};
      if (!storedClicked[postId]) {
        storedClicked[postId] = { claps: false, fires: false, hearts: false };
      }
      storedClicked[postId][type] = !isClicked;
      await AsyncStorage.setItem(`clicked_reactions_${user?.id}`, JSON.stringify(storedClicked));
    } catch (err) {
      console.warn('Failed to save reaction state locally:', err);
    }

    // Update Supabase
    try {
      await QuestRepository.toggleReaction(postId, type, !isClicked);
    } catch (err) {
      console.error('Failed to persist reaction on Supabase:', err);
    }
  };

  const getElapsedTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    return `${Math.floor(diffHours / 24)} gün önce`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Ofis Akışı</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LVL {level}</Text>
          </View>
        </View>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsEmoji}>⭐️</Text>
          <Text style={styles.pointsText}>{user?.points || 0} XP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Users Story Bar */}
        <View style={styles.storiesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
            <Pressable 
              style={styles.addStoryContainer}
              onPress={() => router.replace('/quests')}
            >
              <View style={styles.addStoryCircle}>
                <Text style={styles.addStoryIcon}>+</Text>
              </View>
              <Text style={styles.storyName}>Paylaşım Yap</Text>
            </Pressable>
            {users.map((item, idx) => {
              const borderColors = ['#6b38d4', '#4648d4', '#ffe16d', '#efecf8'];
              const borderColor = borderColors[idx % borderColors.length];
              return (
                <View key={item.id} style={styles.storyContainer}>
                  <View style={[styles.storyCircle, { borderColor }]}>
                    <Image 
                      style={styles.storyAvatar} 
                      source={{ uri: UserRepository.getUserAvatar(item.username) }} 
                    />
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>{item.username}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Feed Posts */}
        {loading && feed.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4648d4" />
          </View>
        ) : feed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz paylaşılan bir görev bulunmuyor.</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.replace('/quests')}>
              <Text style={styles.emptyButtonText}>İlk Görevi Tamamla!</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.feedContainer}>
            {feed.map((post) => {
              const postReacts = reactions[post.id] || { claps: 0, fires: 0, hearts: 0, clicked: {} };
              const userCompletedTag = post.user_id === user?.id ? 'SEN' : `LVL ${Math.floor(Math.random() * 10) + 5}`;
              
              return (
                <View key={post.id} style={styles.feedCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatarContainer}>
                        <Image
                          style={styles.cardAvatar}
                          source={{ uri: UserRepository.getUserAvatar(post.user?.username || 'Gezgin') }}
                        />
                        <View style={styles.cardLevelBadge}>
                          <Text style={styles.cardLevelText}>{userCompletedTag}</Text>
                        </View>
                      </View>
                      <View>
                        <Text style={styles.cardUserName}>{post.user?.username || 'Gezgin'}</Text>
                        <Text style={styles.cardTime}>{getElapsedTime(post.created_at)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Photo Proof */}
                  {post.photo_url && (
                    <View style={styles.cardVisualContainer}>
                      <Image style={styles.cardVisual} source={{ uri: post.photo_url }} />
                      <View style={styles.cardXPBadge}>
                        <Text style={styles.cardXPText}>⚡️ +{post.points_earned} XP</Text>
                      </View>
                    </View>
                  )}

                  {/* Card Body & Details */}
                  <View style={styles.cardBody}>
                    <View style={styles.completedHeader}>
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>GÖREV TAMAMLANDI</Text>
                      </View>
                      <Text style={styles.completedQuestTitle}>{post.quest_name}</Text>
                    </View>

                    <Text style={styles.completedDescription}>
                      {post.quest_name.includes('Kahve') 
                        ? 'Ofisin kahve ihtiyacını karşıladı ve makineyi pırıl pırıl yaptı! ☕️✨'
                        : post.quest_name.includes('Bardak')
                        ? 'Mutfak dolabındaki bardak ve kaşıkları düzenleyerek stok kontrolünü bitirdi. 📦✔️'
                        : 'Ofisteki görünmez görevlerden birini başarıyla tamamlayarak düzeni sağladı. 🧹🌟'}
                    </Text>

                    {/* Interaction Bar */}
                    <View style={styles.interactionsBar}>
                      <View style={styles.reactionButtonsRow}>
                        <Pressable 
                          style={[styles.reactButton, postReacts.clicked.claps && styles.reactButtonActive]}
                          onPress={() => toggleReaction(post.id, 'claps')}
                        >
                          <Text style={styles.reactEmoji}>👏</Text>
                          <Text style={[styles.reactCount, postReacts.clicked.claps && styles.reactCountActive]}>
                            {postReacts.claps}
                          </Text>
                        </Pressable>

                        <Pressable 
                          style={[styles.reactButton, postReacts.clicked.fires && styles.reactButtonActive]}
                          onPress={() => toggleReaction(post.id, 'fires')}
                        >
                          <Text style={styles.reactEmoji}>🔥</Text>
                          <Text style={[styles.reactCount, postReacts.clicked.fires && styles.reactCountActive]}>
                            {postReacts.fires}
                          </Text>
                        </Pressable>

                        <Pressable 
                          style={[styles.reactButton, postReacts.clicked.hearts && styles.reactButtonActive]}
                          onPress={() => toggleReaction(post.id, 'hearts')}
                        >
                          <Text style={styles.reactEmoji}>❤️</Text>
                          <Text style={[styles.reactCount, postReacts.clicked.hearts && styles.reactCountActive]}>
                            {postReacts.hearts}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable 
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.replace('/quests')}
      >
        <Text style={styles.fabIcon}>📸</Text>
      </Pressable>
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
  },
  storiesSection: {
    marginVertical: 12,
  },
  storiesScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  addStoryContainer: {
    alignItems: 'center',
    width: 68,
  },
  addStoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#4648d4',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  addStoryIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4648d4',
  },
  storyContainer: {
    alignItems: 'center',
    width: 68,
  },
  storyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  storyName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#767586',
    marginTop: 4,
    textAlign: 'center',
  },
  feedContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  feedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c7c4d7',
  },
  cardLevelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#4648d4',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  cardLevelText: {
    fontSize: 6,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b1b23',
  },
  cardTime: {
    fontSize: 10,
    color: '#767586',
    fontWeight: '500',
  },
  cardVisualContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  cardVisual: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardXPBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4648d4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardXPText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  cardBody: {
    padding: 16,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  completedBadge: {
    backgroundColor: 'rgba(107, 56, 212, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  completedBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6b38d4',
  },
  completedQuestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b1b23',
  },
  completedDescription: {
    fontSize: 13,
    color: '#767586',
    lineHeight: 18,
    marginBottom: 16,
  },
  interactionsBar: {
    borderTopWidth: 1,
    borderTopColor: '#efecf8',
    paddingTop: 12,
  },
  reactionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f2fe',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  reactButtonActive: {
    backgroundColor: 'rgba(70, 72, 212, 0.12)',
  },
  reactEmoji: {
    fontSize: 14,
  },
  reactCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#767586',
  },
  reactCountActive: {
    color: '#4648d4',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4648d4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  fabIcon: {
    fontSize: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#767586',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#4648d4',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
