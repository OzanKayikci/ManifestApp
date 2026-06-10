import { supabase } from '../config/supabase';
import { UserRepository } from './UserRepository';
import { BadgeRepository } from './BadgeRepository';

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

export class QuestRepository {
  static async getAllQuests(): Promise<Quest[]> {
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
