# Office Quest — Ürün Gereksinimleri Dokümanı (PRD.md)

## 1. Hedef
Office Quest, ofisteki “görünmez ama kritik” günlük rutin operasyonel işleri (temizlik, düzen, stok kontrolleri) oyunlaştırarak ve sosyal bir akış (feed) üzerinden görünür kılarak çözmeyi amaçlayan bir uygulamadır. 

### Çözülen Temel Problemler:
- Rutin işlerin hep aynı kişilerin (inisiyatif alanların) üzerine kalması ve aşırı yük oluşturması.
- İşlerin unutulması veya üşenilerek aksatılması.
- "Kim yaptı?" belirsizliği nedeniyle katkının takdir edilmemesi.
- Manuel yapılan ödül/puan takibinin yüksek yönetimsel yük getirmesi.

---

## 2. Hedef Kitle & Kullanıcı Rolleri
- **Çalışan (Ana Kullanıcı):** Görev seçer, yerine getirir, kanıt fotoğrafı yükler, puan kazanır, feed ve liderlik tablosunu takip eder.
- **Yönetici/Moderatör (İK veya Ofis Yöneticisi):** Liderlik tablosundaki sonuçlara göre ödüllendirmeyi yönetir, görev tanımlarını belirler.

---

## 3. MVP Kapsamı (Minimum Viable Product)
Uygulama, pilot denemelerde kanıtlanan "sosyal rekabet" ve "otomatik takip" mekanizmalarını temel alacaktır.

### A. Görev (Quest) Sistemi (Action Quests)
- **Başlangıç Görev Seti:**
  - Mutfak / İçecek: Kahve makinesi temizliği, filtre kahve hazırlama, çay düzeni kontrolü.
  - Stok: Plastik bardak, çatal-kaşık, şeker/süt kontrolü.
  - Gün Başı / Gün Sonu: Gün başı genel kontrol, gün sonu düzen ve temizlik kontrolü.
- **Onay Mekanizması:** Fotoğraf kanıtı yüklenmesi onay için yeterlidir (AI Vision veya manuel yönetici onayı MVP'de yoktur).
- **Kısıtlar:** Suistimali önlemek amacıyla aynı görevin günde en fazla kaç kez puan kazandırabileceği (örn. kahve makinesi temizliği günde en fazla 2 kez) dinamik olarak sınırlandırılabilir.

### B. Puanlama ve Streak (Çarpan) Mekaniği
- **Taban Puan:** Her görev/kategori için 10–30 XP arası taban puanlar belirlenir.
- **Günlük Çarpan (Streak):** Aynı kullanıcının gün içinde yaptığı ardışık işler için çarpan uygulanır:
  - 1. İş: x1.00 XP
  - 2. İş: x1.25 XP
  - 3. İş: x1.50 XP
  - 4. İş: x1.75 XP
  - 5. ve sonrası: x2.00 XP
- **Yuvarlama:** Hesaplanan çarpanlı puanlar en yakın tam sayıya yuvarlanır.

### C. Sosyal Akış (Feed)
- Dikey akış (Instagram benzeri kartlar) şeklinde listelenir.
- **Kart İçeriği:** Kullanıcı adı/rumuz, görev kategorisi ve kısa açıklaması, kazanılan XP (çarpan dahil), yüklenen kanıt fotoğrafı, zaman damgası.
- **Etkileşim:** Gönderileri beğenme ve yorum yapabilme (opsiyonel/basit düzeyde).

### D. Liderlik Tablosu (Leaderboard) & Ödül Kartı
- **Görünüm Sekmeleri:** Günlük, Haftalık, Aylık ve Yıllık liderlik sıralaması.
- **Kişisel Delta XP Kartı (İmza Özellik):** Kullanıcının liderlik tablosundaki durumuna göre kişiselleştirilmiş yönlendirme sunar.
  - *Örnek:* "Ahmet'i geçmek için 35 XP lazım. 'Kahve Makinesi Temizliği' (+25 XP) veya 'Bardak Stoğu Kontrolü' (+15 XP) yapabilirsin. **Ayrıca Coffee Master rozetine 3 görev kaldı!**"

### E. Rozet Yolculuğu (Heroes Journey)
- Duolingo benzeri, grid yerine dikey bir yol haritası (roadmap) şeklinde kurgulanır. Kullanıcı aşağı kaydırdıkça rozet kilitlerini açarak ilerler.
- **Rozet İlerleme Çubuğu:** Kilitli rozetlerin üzerinde tamamlanma yüzdesi gösterilir (örn: Coffee Master: 37 / 50 görev, %74 tamamlandı).
- **Rozet Serileri:**
  - *Kahve Serisi ☕:* Coffee Starter (1 kahve), Coffee Lover (10 kahve), Coffee Master (50 kahve), Coffee Legend (100 kahve).
  - *Stok Serisi 📦:* Supply Helper (5 stok kontrolü), Supply Guardian (25 stok kontrolü), Supply Master (100 stok kontrolü).
  - *Streak Serisi 🔥:* First Spark (2 görev üst üste), On Fire (5 görev), Unstoppable (10 görev), Machine Mode (20 görev).
  - *Sosyal Serisi 🤝:* İlk paylaşım, İlk fotoğraf, İlk 10 beğeni, İlk 100 beğeni.

---

## 4. Ekran Listesi (MVP)
1. **E1) Dashboard (Görevler):** Bugün yapılabilecek görevlerin listesi (kategoriler ve filtreler: Mutfak, Stok, Gün Başı, Gün Sonu), gün içi yapılan görev sayısı ve güncel XP çarpanı.
2. **E2) Görev Tamamlama:** Seçilen görevin adı/açıklaması, alt kategori seçimi, fotoğraf çekme/seçme ve gönderme.
3. **E3) Social Feed (Ofis Akışı):** Instagram benzeri dikey akış kartları (Kullanıcı, görev, XP, fotoğraf, zaman damgası, beğeni/yorum).
4. **E4) Leaderboard:** Dönemsel (Günlük/Haftalık/Aylık/Yıllık) sıralama ve Delta XP yönlendirme kartı.
5. **E5) Heroes Journey (Rozet Yolculuğu):** Dikey yol haritası şeklinde rozetler, kilit durumları ve ilerleme barları.

---

## 5. Anti-Kapsam (MVP'de Olmayacaklar)
- AI Vision ile otomatik fotoğraf analizi ve doğrulama.
- Yönetici paneli üzerinden manuel görev onaylama akışı (gönderilen her fotoğraf direkt onaylanır).
- Gelişmiş sosyal görevler (başka ekipten biriyle kahve iç, yeni çalışanla tanış vb.).
- Detaylı fotoğraf moderasyon veya raporlama arayüzleri.

---

## 6. Kritik Riskler & Doğrulanan Varsayımlar
- **Ekip Motivasyonu (DOĞRULANDI):** Manuel pilot denemeleriyle ekibin sosyal rekabet ve liderlik tablosuna yüksek katılım sağladığı ve bu durumun rutin işlerin aksamasını azalttığı doğrulanmıştır.
- **Takip Yükü (ÇÖZÜLÜYOR):** Yönetici için manuel puan ve çarpan takibinin zorluğu, uygulamanın otomatik hesaplama ve listeleme yapısıyla ortadan kaldırılacaktır.
- **Sürdürülebilirlik Riski:** Başlangıçtaki heyecan geçtikten sonra katılımın düşmemesi için liderlik tablosu birincilerine somut ödüller verilmesi mekanizması (leaderboard ödül kurgusu) uygulanacaktır.

