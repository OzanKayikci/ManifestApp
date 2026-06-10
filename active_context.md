# active_context.md (Sprint Sözleşmesi - Sprint 4)

## 1. Vizyon Özeti
Office Quest uygulamasına yerel bildirim (Local Notification) desteği eklemek, görev tamamlama, rozet kilit açma ve Yapay Zeka Coach Aura'nın sosyal rekabet tetikleyicilerini gerçek mobil bildirimler olarak cihaza göndermek. `expo-notifications` paketini kurmak ve yapılandırmak.

---

## 2. Kapsam

### Yapılacaklar:
- **Kütüphane Kurulumu:**
  - `expo-notifications` paketini ve gerekli bağımlılıkları yüklemek.
- **Bildirim Yöneticisi Entegrasyonu (`src/config/notifications.ts`):**
  - İzin isteme, Android bildirim kanalı oluşturma (yüksek öncelikli/titreşimli) ve yerel bildirim tetikleme işlevleri.
- **Dinamik Yerel Bildirim Senaryoları:**
  - **Kişisel Başarı:** Kullanıcı bir görev tamamladığında anında yerel bildirim tetikleme: *"Görev Tamamlandı! +38 XP kazandın."*
  - **Rozet Kilit Açma:** Bir rozet kazanıldığında veya ilerleme eşiği aşıldığında bildirim: *"Tebrikler! 'Çaylak Kahveci' rozetinin kilidi açıldı! ☕🎉"*
  - **Sosyal Rekabet (Simüle):** Görev tamamlandıktan 10 saniye sonra simüle edilmiş bir rakip bildirimi: *"Sarah 'Filtre Kahve Hazırlama' görevini tamamladı. Sıralamada seni geçmek üzere!"*
- **Layout Entegrasyonu:**
  - Root `_layout.tsx` dosyasında bildirim izinlerini başlatmak ve gelen bildirim dinleyicilerini (foreground notification handler) kurmak.

### Yapılmayacaklar (Bu Sprint Dışı):
- Harici bir Push Notification sunucusu (FCM veya APNS gibi) üzerinden uzaktan push gönderme (Hackathon hızı ve Expo Go kısıtları nedeniyle tamamen yerel/simüle bildirim altyapısı kurulacaktır).

---

## 3. Sprint Sözleşmesi (Başarı Kriterleri)
1. **İzin İstemi:** Uygulama açılışında bildirim izninin istenmesi ve hata loglarında izin durumunun doğrulanması.
2. **Yerel Bildirim Gönderimi:** Kullanıcı bir görevi tamamladığında bildirim ses ve banner'ının cihazda (veya simülatörde) görünmesi.
3. **Derleme Doğrulaması:** `npx expo export` komutunun sıfır hatayla derleme yapması.

---

## 4. Engeller & Riskler (Obstacles)
- **Simülatör Kısıtları:** iOS simülatörleri yerel bildirim ses ve banner'ını her zaman tam göstermeyebilir. Testleri fiziksel cihazda Expo Go kullanarak veya Android emülatöründe gerçekleştireceğiz.
