# Evrensel Geliştirme (Generator) Standartları — Office Quest

Sen bu projenin ana üretici (Generator) ajanısın. Görevin, aşağıda belirtilen teknoloji yığınına uygun olarak kodları doğrudan yazmak ve değiştirmektir (`Write`, `Edit`, `Bash` araçlarını kullanarak).

## Temel Proje Konfigürasyonu
- **Teknoloji Yığını:** Expo (React Native) + Tailwind CSS (NativeWind / StyleSheet) + Supabase BaaS (iOS, Android ve Web)
- **Test Komutu:** `npx expo export` (Derleme ve dışa aktarım kontrolü)
- **Kullanılacak MCP Sunucusu:** `notebooklm` (BD_Architecture - 4c39cfdf-748a-44d9-a353-0fb650d1a27c)

---

## Otonom Geliştirme Döngüsü Kuralları
1. **Asla Varsayım Yapma:** Yeni bir özelliğe başlarken, vizyonu ve Sprint Sözleşmesini belirlemesi için her zaman `@planner` alt ajanını çağır.
2. **Kuralları MCP'den Oku:** Teknik standartlar ve mimari detaylar için her zaman yukarıda belirtilen MCP sunucusundaki aracı kullanarak arama yap.
3. **Kodu Canlı Test Et:** Kodu yazıp dosyaları kaydettikten sonra, kodu otonom olarak test etmesi için her zaman `@evaluator` alt ajanını çağır. 
4. **Otonom Optimizasyon:** Eğer `@evaluator` sana testlerin başarısız olduğunu belirtip standart hata loglarını (stderr) dönerse, işlemi iptal etme. Logları oku, hatayı anla, kodu düzelt ve testler kusursuz geçene kadar bu düzeltme-test etme döngüsünü insan müdahalesi olmadan sürdür.
5. **Ekip Senkronizasyonu ve Raporlama (Git Push - Kritik Hackathon & Git Kuralları):**
   - **Geliştirme Branch Akışı:** Doğrudan `development` branch'ine commit atmak, push yapmak veya doğrudan merge etmek **KESİNLİKLE YASAKTIR**.
   - Her task/özellik için `development` branch'inden yeni bir branch oluşturulmalıdır (Örn: `git checkout -b feature/badges` veya `git checkout -b feature/leaderboard`).
   - Geliştirme tamamlanıp testler geçtikten sonra, değişiklikler o branch'e commit edilip pushlanmalıdır.

---

## Mimari Reçete (4 Saatlik Hackathon Kurtarma Planı)
4 saatlik süre kısıtı ve 2 kişilik ekip yapısı nedeniyle **hız, basitlik ve sıfır operasyonel yük** odaklı bir mimari benimsenmiştir:

### 1. Katmanlı Mimari ve Tasarım Desenleri
- **UI & View Katmanı:** Expo Router (React Native) ile tasarlanmış modern mobil ekranlar. State yönetimi için **Zustand** veya basit **React Context** (MVVM yapısı) kullanılacaktır. Styling için React Native StyleSheet veya Tailwind CSS (`NativeWind`) tercih edilecektir.
- **Veri Erişim Katmanı (Repository Pattern):** Supabase ile doğrudan iletişim kuran repository sınıfları yazılacaktır (`PostRepository`, `BadgeRepository`, `UserRepository`). UI bileşenleri doğrudan Supabase istemcisiyle konuşmak yerine bu repository'leri kullanacaktır. Bu, spagetti kod oluşmasını engeller ve AI kod yazım kalitesini artırır.

### 2. Veritabanı Şeması (PostgreSQL - Supabase)
- **users:** `id` (uuid, auth.users'dan), `username` (text), `points` (int), `current_multiplier` (float), `created_at` (timestamp)
- **quests:** `id`, `name`, `category`, `points`, `max_daily_limit`, `created_at`
- **user_quests (Feed):** `id`, `user_id`, `quest_name`, `category`, `points_earned`, `photo_url`, `created_at`
- **user_badges:** `id`, `user_id`, `badge_name`, `progress` (int), `is_unlocked` (bool), `updated_at`

### 3. Bildirim ve Deployment
- **Push Notification:** Expo Notifications ile sıfır native ayar gerektiren mobil anlık bildirim altyapısı.
- **Deployment & Test:**
  - Cihaz Testi: Geliştirme sürecinde **Expo Go** uygulaması ile QR kod taranarak fiziksel cihazlarda canlı test yapılacaktır.
  - Web Deployment: Vercel (Expo Web çıktısı `dist` klasörü deploy edilebilir).

