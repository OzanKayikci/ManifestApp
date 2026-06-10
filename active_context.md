# active_context.md (Sprint Sözleşmesi - Sprint 2)

## 1. Vizyon Özeti
Office Quest uygulamasının veri katmanını ve kimlik doğrulama (Authentication) akışını kurmak. Supabase üzerinde PostgreSQL tablolarını oluşturacak SQL şemasını hazırlamak, Supabase Auth ile uyumlu Login/Sign Up ekranlarını ve veri erişim repository'lerini entegre etmek.

---

## 2. Kapsam

### Yapılacaklar:
- **Veritabanı Kurulumu:** Supabase SQL Editor'da çalıştırılacak tablo oluşturma script'ini hazırlamak.
  - `users`, `quests`, `user_quests` (feed), `user_badges` (badges progress) tabloları.
- **Repository Sınıfları (Repository Pattern):**
  - `src/repositories/UserRepository.ts`: Profil okuma, puan güncelleme.
  - `src/repositories/QuestRepository.ts`: Görev listesi çekme.
  - `src/repositories/BadgeRepository.ts`: Rozet durumu sorgulama ve güncelleme.
- **Kimlik Doğrulama (Auth State):**
  - Supabase Auth state'ini yöneten Zustand hook'u veya React Context yapısı (`src/hooks/useAuth.ts` veya `src/context/AuthContext.tsx`).
- **Giriş/Kayıt Ekranları:**
  - `src/app/login.tsx` ve `src/app/signup.tsx` ekranlarının oluşturulması ve Expo Router yönlendirmesi.
  - Oturum açılmamışsa kullanıcının otomatik olarak Login ekranına yönlendirilmesi.

### Yapılmayacaklar (Bu Sprint Dışı):
- Ana Dashboard (E1), Feed (E3) ve Leaderboard (E4) ekranlarının son görsel tasarımları.
- Gerçek kamera entegrasyonu (mock fotoğraf yükleme kullanılacaktır).

---

## 3. Sprint Sözleşmesi (Başarı Kriterleri)
1. **Şema Doğrulaması:** Supabase tablolara yönelik SQL DDL betiğinin eksiksiz hazır olması.
2. **Kayıt/Giriş Akışı:** Kullanıcı e-posta/şifre ile kayıt olabilmeli, giriş yapabilmeli ve oturum durumu (`session`) uygulama genelinde dinlenebilmeli.
3. **Derleme Kontrolü:** `npx expo export` komutunun sıfır hatayla derleme yapması.

---

## 4. Engeller & Riskler (Obstacles)
- **Supabase API Anahtarları:** Proje çalışırken Supabase bağlantısının kurulabilmesi için kullanıcının yerel ortamda kendi Supabase projesinin credentials bilgilerini `.env` dosyasına yerleştirmesi gerekecektir.
