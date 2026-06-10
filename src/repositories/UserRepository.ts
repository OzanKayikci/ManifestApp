import { supabase } from '../config/supabase';
import { UserProfile, useAuth } from '../hooks/useAuth';

// In-memory store for completed quests counts today in mock mode
let mockQuestsCompletedTodayCount = 0;

export class UserRepository {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      return useAuth.getState().user;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  }

  static async getCompletedQuestsCountToday(userId: string): Promise<number> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      return mockQuestsCompletedTodayCount;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('user_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString());

    if (error) {
      console.error('Error fetching completed quests count:', error);
      return 0;
    }
    return count || 0;
  }

  static calculateMultiplier(completedQuestsCountToday: number): number {
    // completedQuestsCountToday is the count BEFORE the new one is completed.
    // 0 completed -> this is the 1st -> x1.0
    // 1 completed -> this is the 2nd -> x1.25
    // 2 completed -> this is the 3rd -> x1.50
    // 3 completed -> this is the 4th -> x1.75
    // 4+ completed -> this is 5th or more -> x2.0
    if (completedQuestsCountToday === 0) return 1.0;
    if (completedQuestsCountToday === 1) return 1.25;
    if (completedQuestsCountToday === 2) return 1.50;
    if (completedQuestsCountToday === 3) return 1.75;
    return 2.0;
  }

  static async awardPoints(userId: string, basePoints: number): Promise<{ pointsEarned: number; newPointsTotal: number; multiplierUsed: number } | null> {
    const countToday = await this.getCompletedQuestsCountToday(userId);
    const multiplier = this.calculateMultiplier(countToday);
    const pointsEarned = Math.round(basePoints * multiplier);

    const isMock = useAuth.getState().isMock;
    if (isMock) {
      const profile = useAuth.getState().user;
      if (!profile) return null;
      
      const newPointsTotal = profile.points + pointsEarned;
      const updatedProfile: UserProfile = {
        ...profile,
        points: newPointsTotal,
        current_multiplier: multiplier,
      };

      // Update Zustand auth store
      useAuth.setState({ user: updatedProfile });
      mockQuestsCompletedTodayCount += 1;

      return { pointsEarned, newPointsTotal, multiplierUsed: multiplier };
    }

    const profile = await this.getProfile(userId);
    if (!profile) return null;

    const newPointsTotal = profile.points + pointsEarned;

    const { error } = await supabase
      .from('users')
      .update({
        points: newPointsTotal,
        current_multiplier: multiplier,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user points:', error);
      return null;
    }

    return { pointsEarned, newPointsTotal, multiplierUsed: multiplier };
  }
}
