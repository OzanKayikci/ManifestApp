# Office Quest 🏆

Ofis içi görünmez katkıları, operasyonları ve günlük görevleri (kahve makinesi temizliği, mutfak düzeni, stok kontrolleri vb.) oyunlaştırarak sosyal bir akışa, seviyelere ve rozetlere dönüştüren mobil ve web tabanlı bir sosyal yardımlaşma uygulamasıdır.

---

## 🚀 Öne Çıkan Özellikler

1. **Giriş Yap & Kayıt Ol (Supabase Auth):**
   - Güvenli e-posta tabanlı üyelik sistemi.
   - Yeni üyelik sonrasında PostgreSQL tetikleyicileri (triggers) sayesinde otomatik oluşturulan kullanıcı profilleri.
   - Önbellek dostu ve kalıcı oturum yönetimi.

2. **Dinamik Dashboard (Ana Sayfa):**
   - Kullanıcının seviyesini (LVL), toplam XP puanını ve aktif streak gününü gösteren profil kartı.
   - Akıllı Yapay Zeka Coach (Aura Card): Canlı liderlik tablosunu analiz ederek bir üstündeki rakibini geçmesi için tam olarak kaç XP kaldığını söyleyen dinamik motivasyon motoru.
   - Aktif kahraman görevi ve hızlı erişim kategorileri.

3. **Görevler & Fotoğraflı Kanıt (Camera & Storage):**
   - Ofis içi görevleri listeleyen, kategori bazlı filtreleme sunan ekran.
   - **Gerçek Kamera Entegrasyonu:** Görev tamamlama aşamasında cihaz kamerasıyla fotoğraf çekme veya galeriden görsel seçme.
   - **Supabase Storage Yükleme:** Çekilen fotoğrafları Supabase Storage bulut sunucusuna yükleme ve benzersiz linklerini veri tabanına kaydetme.
   - Günlük görev tamamlama sıklığına göre artan **Streak Çarpanı (Multiplier)**.

4. **Sosyal Akış (Social Feed):**
   - Ofisteki tüm kayıtlı kullanıcıları listeleyen dinamik hikayeler (story) barı.
   - Yapılan görevleri, fotoğraf kanıtlarıyla, harcanan zamanla ve kazanılan XP'lerle listeleyen kartlar.
   - Canlı Alkış (Clap), Ateş (Fire) ve Kalp (Heart) etkileşimleri. Tıklanan durumlar cihazda saklanır ve etkileşim sayıları Supabase tablosunda güncellenir.

5. **Liderlik Tablosu (Leaderboard):**
   - Günlük, Haftalık ve Aylık periyotlara göre puan durumu.
   - Kürsü (Podium) tasarımı: 1., 2. ve 3. sıralardaki kullanıcılara özel taç ve metalik renk çerçeveleri.
   - Detaylı rakip listesi.

6. **Kahramanın Yolculuğu (Badge Journey):**
   - Duolingo tarzı dikey gelişim haritası.
   - Tamamlanan görev sayılarına ve kategorilerine göre otomatik açılan rozet kilitleri (Örn: Çaylak Kahveci, Stok Muhafızı).
   - Seviye gereksinimleri ve kilitli alan gösterimleri.

7. **Native Bildirimler (Expo Notifications):**
   - Görev tamamlandığında, rozet kilitleri açıldığında ve rekabet tetiklendiğinde native işletim sistemi bildirimleri (Push Notification) gönderen bildirim motoru.

---

## 🛠️ Teknoloji Yığını

- **Core:** React Native, Expo SDK 56
- **Veri Tabanı & Auth:** Supabase (PostgreSQL & Storage)
- **State Yönetimi:** Zustand
- **Yönlendirme (Routing):** Expo Router (File-based)
- **Styling:** React Native StyleSheet (Premium Glassmorphism & Micro-animations)
- **Medya & Sensör:** Expo Image Picker, Expo File System
- **Bildirimler:** Expo Notifications

---

## 💾 Kurulum ve Veri Tabanı Yapılandırması

### 1. Bağımlılıkları Yükleyin
Proje dizininde terminali açın ve bağımlılıkları yükleyin:
```bash
npm install
```

### 2. Çevre Değişkenlerini Tanımlayın
Kök dizinde `.env` isminde bir dosya oluşturun ve Supabase bilgilerinizi ekleyin (Örnek şablon için [.env.example](file:///Users/laivinieks/personalProjects/TeamManifest/ManifestApp/.env.example) dosyasına göz atabilirsiniz):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase SQL Yapılandırması
Supabase Dashboard -> **SQL Editor** sayfasına giderek [schema.sql](file:///Users/laivinieks/personalProjects/TeamManifest/ManifestApp/src/config/schema.sql) içerisindeki tüm sorguları sırayla çalıştırın. Bu işlem aşağıdaki tabloları, tetikleyicileri ve ilk görev şablonlarını oluşturacaktır:
- `users` (Profil bilgileri)
- `quests` (Görev şablonları)
- `user_quests` (Tamamlanan görevler ve sayaçlar)
- `user_badges` (Kazanılan rozetler)

Sayaç güncellemelerinin aktif çalışabilmesi için şu RLS politikasını da SQL Editor üzerinde çalıştırın:
```sql
create policy "Anyone can update quest reaction counts" on public.user_quests
  for update using (true);
```

### 4. Supabase Storage Yapılandırması
Kamera fotoğraflarının yüklenebilmesi için Supabase Dashboard -> **Storage** kısmına gidin:
1. `quest-proofs` isminde **Public** bir bucket oluşturun.
2. Aşağıdaki SQL kodlarını çalıştırarak bucket için okuma ve yazma politikalarını aktif hale getirin:
```sql
-- Herkesin okuyabilmesi için RLS politikası
create policy "Public Access to Quest Proofs"
  on storage.objects for select
  using ( bucket_id = 'quest-proofs' );

-- Giriş yapanların yükleme yapabilmesi için RLS politikası
create policy "Users can upload quest proofs"
  on storage.objects for insert
  with check ( bucket_id = 'quest-proofs' );
```

---

## 🏃‍♂️ Uygulamayı Çalıştırma

Geliştirici Metro sunucusunu başlatmak için:
```bash
npx expo start --clear
```

- **Web sürümü için:** Tarayıcıda açmak üzere terminalde `w` tuşuna basın.
- **Android sürümü için:** Emülatörde çalıştırmak üzere `a` tuşuna basın.
- **iOS sürümü için:** Simülatörde çalıştırmak üzere `i` tuşuna basın.
- **Fiziksel Cihazda test etmek için:** Telefonunuza **Expo Go** uygulamasını indirin ve terminalde çıkan QR kodu kameranızla taratın.
