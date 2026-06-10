import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import { genAI } from '../config/gemini';
import { mockFeedData } from './QuestRepository';

export class CoachRepository {
  static async getLastActivity(userId: string): Promise<string> {
    const isMock = useAuth.getState().isMock;
    
    if (isMock) {
      const userMockQuests = mockFeedData.filter(q => q.user_id === userId);
      if (userMockQuests.length === 0) {
        return 'Hiç görev yapmadı';
      }
      const latest = userMockQuests[0]; // mockFeedData is unshifted/sorted newest first
      return this.formatLastActivityDate(latest.created_at);
    }

    try {
      const { data, error } = await supabase
        .from('user_quests')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last activity:', error);
        return 'Uzun süredir görev yapmadı';
      }

      if (!data || data.length === 0) {
        return 'Hiç görev yapmadı';
      }

      return this.formatLastActivityDate(data[0].created_at);
    } catch (err) {
      console.error('Failed to get last activity:', err);
      return 'Uzun süredir görev yapmadı';
    }
  }

  private static formatLastActivityDate(createdAtStr: string): string {
    const createdDate = new Date(createdAtStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'Az önce görev yaptı';
      }
      return 'Bugün görev yaptı';
    } else if (diffDays === 1) {
      return 'Dün görev yaptı';
    } else {
      return `${diffDays} gündür görev yapmadı`;
    }
  }

  static async getCoachAdvice(points: number, level: number, userId: string): Promise<string> {
    const isMock = useAuth.getState().isMock;
    const lastActivity = await this.getLastActivity(userId);

    if (isMock || !genAI) {
      // Mock mode fallback or missing API key fallback
      if (lastActivity.includes('gündür görev yapmadı')) {
        return 'Bugün kolay bir stok kontrolü yaparak puanını artırabilir ve ritmini yeniden başlatabilirsin.';
      }
      return 'Harika ilerliyorsun, bugün mutfak alanında ufak bir temizlik ile serini sürdürmeye ne dersin?';
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const systemInstruction = 
        'Sen Office Quest için kısa aktivite koçusun.\n' +
        'Kullanıcının durumunu (seviye, EXP, son aktivite) incele ve buna göre değişen, kişiselleştirilmiş, tek cümlelik Türkçe öneri yaz.\n' +
        'Eğer son aktivite üzerinden gün geçmişse harekete geçirici, yeni görev yapmışsa tebrik edip sonraki adımı öneren yaratıcı ve farklı öneriler ver.\n' +
        'Maksimum 120 karakter.\n' +
        'Pozitif, net, uygulanabilir ol.\n' +
        'Emoji, markdown, liste ve açıklama kullanma.\n' +
        'Sadece öneri metnini döndür.';

      const prompt = `EXP: ${points}\nSeviye: ${level}\nSonAktivite: ${lastActivity}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 100,
          temperature: 0.7,
        }
      });

      const responseText = result.response.text();
      return responseText.trim().replace(/["'\n]/g, '');
    } catch (err) {
      console.error('Error generating content from Gemini:', err);
      return 'Bugün kolay bir stok kontrolü yaparak puanını artırabilir ve ritmini yeniden başlatabilirsin.';
    }
  }
}
