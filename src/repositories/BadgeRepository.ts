import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import { UserRepository } from './UserRepository';

export interface UserBadge {
  id: string;
  user_id: string;
  badge_name: string;
  progress: number;
  is_unlocked: boolean;
  updated_at: string;
}

// Badge requirements definition
export const BADGE_DEFINITIONS: Record<string, { series: string; threshold: number; displayName: string; icon: string }> = {
  // Kahve Serisi
  'Coffee Starter': { series: 'coffee', threshold: 1, displayName: 'Coffee Starter', icon: '☕' },
  'Coffee Lover': { series: 'coffee', threshold: 10, displayName: 'Coffee Lover', icon: '☕☕' },
  'Coffee Master': { series: 'coffee', threshold: 50, displayName: 'Coffee Master', icon: '☕☕☕' },
  'Coffee Legend': { series: 'coffee', threshold: 100, displayName: 'Coffee Legend', icon: '☕☕☕☕' },
  // Stok Serisi
  'Supply Helper': { series: 'supply', threshold: 5, displayName: 'Supply Helper', icon: '📦' },
  'Supply Guardian': { series: 'supply', threshold: 25, displayName: 'Supply Guardian', icon: '📦📦' },
  'Supply Master': { series: 'supply', threshold: 100, displayName: 'Supply Master', icon: '📦📦📦' },
  // Streak Serisi
  'First Spark': { series: 'streak', threshold: 2, displayName: 'First Spark', icon: '🔥' },
  'On Fire': { series: 'streak', threshold: 5, displayName: 'On Fire', icon: '🔥🔥' },
  'Unstoppable': { series: 'streak', threshold: 10, displayName: 'Unstoppable', icon: '🔥🔥🔥' },
  'Machine Mode': { series: 'streak', threshold: 20, displayName: 'Machine Mode', icon: '🔥🔥🔥🔥' },
  // Sosyal Serisi
  'İlk paylaşım': { series: 'social_post', threshold: 1, displayName: 'İlk paylaşım', icon: '👍' },
  'İlk fotoğraf': { series: 'social_photo', threshold: 1, displayName: 'İlk fotoğraf', icon: '📸' },
};

// Mock User Badges
export let mockUserBadges: UserBadge[] = [
  { id: 'b1', user_id: 'mock-user-id', badge_name: 'Coffee Starter', progress: 1, is_unlocked: true, updated_at: new Date().toISOString() },
  { id: 'b2', user_id: 'mock-user-id', badge_name: 'Coffee Lover', progress: 3, is_unlocked: false, updated_at: new Date().toISOString() },
  { id: 'b3', user_id: 'mock-user-id', badge_name: 'Supply Helper', progress: 2, is_unlocked: false, updated_at: new Date().toISOString() },
  { id: 'b4', user_id: 'mock-user-id', badge_name: 'First Spark', progress: 1, is_unlocked: false, updated_at: new Date().toISOString() },
];

export class BadgeRepository {
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      return mockUserBadges;
    }

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
    return data || [];
  }

  static async updateBadgeProgressAfterQuest(
    userId: string,
    category: string,
    questName: string,
    hasPhoto: boolean
  ): Promise<string[]> {
    const unlockedBadgeNames: string[] = [];
    try {
      const isMock = useAuth.getState().isMock;
      const isKahve = questName.toLowerCase().includes('kahve');
      const isStok = category === 'Stok';

      const userBadges = await this.getUserBadges(userId);
      const badgeMap = new Map(userBadges.map(b => [b.badge_name, b]));

      const incrementBadge = async (badgeName: string) => {
        const existing = badgeMap.get(badgeName);
        const threshold = BADGE_DEFINITIONS[badgeName]?.threshold || 1;
        const currentProgress = existing ? existing.progress : 0;
        const newProgress = currentProgress + 1;
        const isUnlocked = newProgress >= threshold;
        const wasUnlockedBefore = existing ? existing.is_unlocked : false;

        if (isUnlocked && !wasUnlockedBefore) {
          unlockedBadgeNames.push(badgeName);
        }

        if (isMock) {
          if (existing) {
            existing.progress = newProgress;
            existing.is_unlocked = isUnlocked || existing.is_unlocked;
            existing.updated_at = new Date().toISOString();
          } else {
            mockUserBadges.push({
              id: `b-mock-${Date.now()}-${badgeName}`,
              user_id: userId,
              badge_name: badgeName,
              progress: newProgress,
              is_unlocked: isUnlocked,
              updated_at: new Date().toISOString(),
            });
          }
          return;
        }

        if (existing) {
          await supabase
            .from('user_badges')
            .update({
              progress: newProgress,
              is_unlocked: isUnlocked || existing.is_unlocked,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_name: badgeName,
              progress: newProgress,
              is_unlocked: isUnlocked,
            });
        }
      };

      if (isKahve) {
        await incrementBadge('Coffee Starter');
        await incrementBadge('Coffee Lover');
        await incrementBadge('Coffee Master');
        await incrementBadge('Coffee Legend');
      }

      if (isStok) {
        await incrementBadge('Supply Helper');
        await incrementBadge('Supply Guardian');
        await incrementBadge('Supply Master');
      }

      await incrementBadge('İlk paylaşım');
      if (hasPhoto) {
        await incrementBadge('İlk fotoğraf');
      }

      // Handle daily count streak
      let dailyCount = 1;
      if (isMock) {
        dailyCount = await UserRepository.getCompletedQuestsCountToday(userId);
      } else {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from('user_quests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startOfDay.toISOString());
        dailyCount = (count || 0) + 1; // +1 since we're currently inserting/running the new quest completion
      }
      
      const updateStreakBadge = async (badgeName: string) => {
        const existing = badgeMap.get(badgeName);
        const threshold = BADGE_DEFINITIONS[badgeName]?.threshold || 1;
        const isUnlocked = dailyCount >= threshold;
        const wasUnlockedBefore = existing ? existing.is_unlocked : false;

        if (isUnlocked && !wasUnlockedBefore) {
          unlockedBadgeNames.push(badgeName);
        }

        if (isMock) {
          if (existing) {
            existing.progress = dailyCount;
            existing.is_unlocked = isUnlocked || existing.is_unlocked;
            existing.updated_at = new Date().toISOString();
          } else {
            mockUserBadges.push({
              id: `b-mock-${Date.now()}-${badgeName}`,
              user_id: userId,
              badge_name: badgeName,
              progress: dailyCount,
              is_unlocked: isUnlocked,
              updated_at: new Date().toISOString(),
            });
          }
          return;
        }

        if (existing) {
          await supabase
            .from('user_badges')
            .update({
              progress: dailyCount,
              is_unlocked: isUnlocked || existing.is_unlocked,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_name: badgeName,
              progress: dailyCount,
              is_unlocked: isUnlocked,
            });
        }
      };

      await updateStreakBadge('First Spark');
      await updateStreakBadge('On Fire');
      await updateStreakBadge('Unstoppable');
      await updateStreakBadge('Machine Mode');

      return unlockedBadgeNames;
    } catch (error) {
      console.error('Error inside updateBadgeProgressAfterQuest:', error);
      return [];
    }
  }
}
