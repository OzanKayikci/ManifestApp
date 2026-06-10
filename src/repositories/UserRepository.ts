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

  static getUserAvatar(username: string): string {
    const avatars = [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // Sarah
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // Ahmet
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Elena
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', // Can
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', // Melissa
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', // Murat
    ];
    if (!username) return avatars[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatars.length;
    return avatars[index];
  }

  static getUserTeam(username: string): string {
    const teams = ['Tasarım', 'Yazılım', 'İK', 'Pazarlama', 'Finans', 'Ürün'];
    if (!username) return teams[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % teams.length;
    return teams[index];
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      const mockUsers = [
        { id: 'mock-user-1', username: 'Ahmet L.', points: 1420, current_multiplier: 1.0, created_at: new Date().toISOString() },
        { id: 'mock-user-2', username: 'Sarah K.', points: 1265, current_multiplier: 1.0, created_at: new Date().toISOString() },
        { id: 'mock-user-3', username: 'Elena R.', points: 1120, current_multiplier: 1.0, created_at: new Date().toISOString() },
        { id: 'mock-user-4', username: 'Can D.', points: 850, current_multiplier: 1.0, created_at: new Date().toISOString() },
      ];
      const currentUser = useAuth.getState().user;
      if (currentUser && !mockUsers.some(u => u.id === currentUser.id)) {
        mockUsers.push(currentUser);
      }
      return mockUsers.sort((a, b) => b.points - a.points);
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
    return data || [];
  }

  static async getPeriodLeaderboard(period: 'daily' | 'weekly' | 'monthly'): Promise<UserProfile[]> {
    const isMock = useAuth.getState().isMock;
    if (isMock) {
      const users = await this.getAllUsers();
      const multiplier = period === 'daily' ? 0.05 : period === 'weekly' ? 0.25 : 1.0;
      return users
        .map(u => ({
          ...u,
          points: Math.round(u.points * multiplier)
        }))
        .sort((a, b) => b.points - a.points);
    }

    const users = await this.getAllUsers();

    let startDate = new Date();
    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(startDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const { data: questsData, error: questsError } = await supabase
      .from('user_quests')
      .select('user_id, points_earned')
      .gte('created_at', startDate.toISOString());

    if (questsError) {
      console.error('Error fetching period quests for leaderboard:', questsError);
      return users.sort((a, b) => b.points - a.points);
    }

    const quests = questsData || [];
    const pointsMap: Record<string, number> = {};
    quests.forEach(q => {
      pointsMap[q.user_id] = (pointsMap[q.user_id] || 0) + q.points_earned;
    });

    const leaderboard = users.map(u => ({
      ...u,
      points: pointsMap[u.id] || 0
    }));

    return leaderboard.sort((a, b) => b.points - a.points);
  }
}
