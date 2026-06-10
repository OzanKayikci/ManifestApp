import { supabase } from '../config/supabase';
import { UserRepository } from './UserRepository';
import { BadgeRepository } from './BadgeRepository';
import { useAuth } from '../hooks/useAuth';

export interface Quest {
  id: string;
  name: string;
  category: string;
  points: number;
  max_daily_limit: number;
  created_at: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_name: string;
  category: string;
  points_earned: number;
  photo_url: string | null;
  created_at: string;
  user?: {
    username: string;
  };
}

// Mock Data definitions
export const MOCK_QUESTS: Quest[] = [
  { id: 'q1', name: 'Kahve Makinesi Temizliği', category: 'Mutfak', points: 25, max_daily_limit: 2, created_at: new Date().toISOString() },
  { id: 'q2', name: 'Filtre Kahve Hazırlama', category: 'Mutfak', points: 15, max_daily_limit: 3, created_at: new Date().toISOString() },
  { id: 'q3', name: 'Bardak ve Kaşık Kontrolü', category: 'Stok', points: 10, max_daily_limit: 2, created_at: new Date().toISOString() },
  { id: 'q4', name: 'Süt ve Şeker Takviyesi', category: 'Stok', points: 15, max_daily_limit: 2, created_at: new Date().toISOString() },
  { id: 'q5', name: 'Sabah Masa Düzeni', category: 'Gün Başı', points: 20, max_daily_limit: 1, created_at: new Date().toISOString() },
  { id: 'q6', name: 'Akşam Çöp Boşaltma', category: 'Gün Sonu', points: 30, max_daily_limit: 1, created_at: new Date().toISOString() },
];

export const MOCK_FEED: UserQuest[] = [
  {
    id: 'f1',
    user_id: 'user-sarah',
    quest_name: 'Kahve Makinesi Temizliği',
    category: 'Mutfak',
    points_earned: 25,
    photo_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    user: { username: 'Sarah' }
  },
  {
    id: 'f2',
    user_id: 'user-ahmet',
    quest_name: 'Bardak ve Kaşık Kontrolü',
    category: 'Stok',
    points_earned: 15,
    photo_url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=500',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    user: { username: 'Ahmet' }
  },
  {
    id: 'f3',
    user_id: 'user-can',
    quest_name: 'Sabah Masa Düzeni',
    category: 'Gün Başı',
    points_earned: 20,
    photo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    user: { username: 'Can' }
  }
];

export let mockFeedData = [...MOCK_FEED];

export class QuestRepository {
  static async getAllQuests(): Promise<Quest[]> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      return MOCK_QUESTS;
    }

    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) {
      console.error('Error fetching quests:', error);
      return [];
    }
    return data || [];
  }

  static async completeQuest(
    userId: string,
    questName: string,
    category: string,
    basePoints: number,
    photoUrl: string | null
  ): Promise<{ success: boolean; pointsEarned: number; newPointsTotal: number; multiplierUsed: number } | null> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      const pointsResult = await UserRepository.awardPoints(userId, basePoints);
      if (!pointsResult) return null;

      const { pointsEarned, newPointsTotal, multiplierUsed } = pointsResult;

      const newQuestCompletion: UserQuest = {
        id: `f-mock-${Date.now()}`,
        user_id: userId,
        quest_name: questName,
        category: category,
        points_earned: pointsEarned,
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
        created_at: new Date().toISOString(),
        user: { username: useAuth.getState().user?.username || 'Alex' }
      };

      mockFeedData.unshift(newQuestCompletion);

      // Update badges async
      BadgeRepository.updateBadgeProgressAfterQuest(userId, category, questName).catch(err => {
        console.error('Error updating badge progress:', err);
      });

      return { success: true, pointsEarned, newPointsTotal, multiplierUsed };
    }

    const pointsResult = await UserRepository.awardPoints(userId, basePoints);
    if (!pointsResult) return null;

    const { pointsEarned, newPointsTotal, multiplierUsed } = pointsResult;

    const { error: insertError } = await supabase
      .from('user_quests')
      .insert({
        user_id: userId,
        quest_name: questName,
        category: category,
        points_earned: pointsEarned,
        photo_url: photoUrl,
      });

    if (insertError) {
      console.error('Error inserting user quest:', insertError);
      return null;
    }

    // Update badges async
    BadgeRepository.updateBadgeProgressAfterQuest(userId, category, questName).catch(err => {
      console.error('Error updating badge progress:', err);
    });

    return { success: true, pointsEarned, newPointsTotal, multiplierUsed };
  }

  static async getFeed(limit: number = 20): Promise<UserQuest[]> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      return mockFeedData.slice(0, limit);
    }

    const { data, error } = await supabase
      .from('user_quests')
      .select('*, user:users(username)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching feed:', error);
      return [];
    }
    return data || [];
  }
}
