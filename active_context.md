# active_context.md (Sprint Sözleşmesi - Sprint 3)

## 1. Vizyon Özeti
Office Quest uygulamasının 5 ana ekranını (Dashboard, Görevler, Feed, Leaderboard ve Heroes Journey) Stitch tasarımları ve PRD doğrultusunda React Native/Expo Router ile kodlamak, Supabase Repository katmanına bağlamak ve tam çalışır hale getirmek.

---

## 2. Kapsam

### Yapılacaklar:
- **Sekmeli Navigasyon Güncellemesi:**
  - `src/components/app-tabs.tsx` ve `src/components/app-tabs.web.tsx` dosyalarını 5 ana sekmeyi (Home, Quests, Social, Rank, Journey) içerecek şekilde güncellemek.
- **Ekranların Kodlanması:**
  - **E1) Dashboard (Home - `index.tsx`):** Profil özeti (XP, Level, Günlük Çarpan/Streak alev ikonu), aktif günlük görev kartı, bir sonraki seviyeye kalan XP progress barı.
  - **E2) Quests & Görev Tamamlama (`quests.tsx`):** Kategorilere göre (Mutfak, Stok, Gün Başı, Gün Sonu) tüm aktif görevler, görev seçilince açılan "Bu İşi Ben Yaptım" fotoğraf çekme/seçme mock modal'ı ve tamamlanma başarısı.
  - **E3) Social Feed (`feed.tsx`):** Instagram benzeri dikey akış kartları (Kullanıcı avatarı, kullanıcı adı, XP, görev adı, yüklenen fotoğraf, zaman, beğeni/yorum butonları).
  - **E4) Leaderboard (`leaderboard.tsx`):** Günlük/Haftalık/Aylık/Yıllık sıralama tablosu ve kişisel Delta XP kartı (Rakibini geçmek için kalan XP ve önerilen görevler/rozetler).
  - **E5) Heroes Journey (`journey.tsx`):** Duolingo benzeri dikey rozet yol haritası (kilitli/açık durumlar, progress bar yüzdeleri).

### Yapılmayacaklar (Bu Sprint Dışı):
- Gerçek Push Notification entegrasyonu (Sonraki sprint konusu).
- Gerçek kamera donanımı erişimi (Hackathon hızı için cihaz galerisinden mock görsel seçimi veya önceden tanımlanmış görseller kullanılacaktır).

---

## 3. Sprint Sözleşmesi (Başarı Kriterleri)
1. **Navigasyon Geçişleri:** 5 ana sekme arasında geçişlerin kusursuz çalışması.
2. **Repository Bağlantısı:** Ekranlardaki verilerin Supabase repository'lerinden (veya mock modda ise mock veri kaynaklarından) dinamik olarak okunması ve görev tamamlandığında veri katmanının (XP, alev, feed ve rozet ilerlemeleri) anında güncellenmesi.
3. **Derleme Doğrulaması:** `npx expo export` komutunun sıfır hatayla derleme yapması.

---

## 4. Engeller & Riskler (Obstacles)
- **Stitch İkonları ve Stil Uyumu:** Stitch tasarımlarında Google Material İkonları kullanılmıştır. Expo üzerinde bu ikonları vektörel veya SVG formatında uyumlu hale getirmeliyiz.
