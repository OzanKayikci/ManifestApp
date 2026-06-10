# active_context.md (Sprint Sözleşmesi)

## 1. Vizyon Özeti
Office Quest mobil uygulamasını Expo (React Native) ile sıfırdan kurmak, gerekli temel paketleri (Supabase, Zustand vb.) entegre etmek ve projenin hatasız derlenip çalışabilir durumda olduğunu `npx expo export` testiyle doğrulamak.

---

## 2. Kapsam

### Yapılacaklar:
- Proje kök dizininde Expo (React Native) projesini başlatmak.
- Temel bağımlılıkları (`@supabase/supabase-js`, `zustand`, `react-native-url-polyfill`) kurmak.
- Klasör mimarisini (components, repositories, screens, styles, config) oluşturmak.
- Supabase istemci bağlantısını (`config/supabase.js`) kurmak.
- Projenin başarıyla derlenebildiğini doğrulamak.

### Yapılmayacaklar (Bu Sprint Dışı):
- Gerçek UI ekranlarının tasarlanması (Dashboard, Feed, Leaderboard vb.).
- Supabase üzerinde veritabanı tablolarının oluşturulması veya veri okuma/yazma işlemleri.
- Push notification altyapısının kodlanması.

---

## 3. Sprint Sözleşmesi (Başarı Kriterleri)
1. **Paket Kurulumu:** `package.json` dosyasının oluşması ve içinde `expo` ile `@supabase/supabase-js` paketlerinin yer alması.
2. **Derleme Doğrulaması:** `npx expo export` komutunun terminalde sıfır hata (exit code: 0) ile çalışması.
3. **Supabase Entegrasyonu:** Supabase istemcisinin (`supabase.js`) initialized olması ve `react-native-url-polyfill` importunun yapılmış olması.

---

## 4. Engeller & Riskler (Obstacles)
- **Supabase credentials eksikliği:** Başlangıçta Supabase URL ve Anon Key değerleri `.env` dosyasından veya geçici mock değerlerden okunacak şekilde esnek kurgulanmalıdır.
- **Hackathon Hız Kısıtı:** İlk kurulumun 15 dakikayı geçmemesi, Xcode/Android Studio yerel derleme araçlarının kullanılmayıp sadece Expo CLI derlemesinin test edilmesi kritik önemdedir.
