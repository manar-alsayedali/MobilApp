# Odaklanma Zamanlayıcısı Mobil Uygulaması

Bu proje, kullanıcıların odaklanma (Pomodoro tarzı) seanslarını takip edebileceği,
kategori bazlı istatistikler tutabileceği ve geçmiş oturumlarını inceleyebileceği
bir **React Native + Expo** mobil uygulamasıdır.

Uygulama, özellikle öğrencilerin ve yazılım geliştiricilerin çalışma sürelerini
planlamalarını, dikkat dağınıklıklarını fark etmelerini ve zaman içindeki
performanslarını görselleştirmelerini amaçlamaktadır.

---

## Özellikler

- **Zamanlayıcı (Ana Sayfa / Zamanlayıcı Ekranı)**
  - Varsayılan 25 dakikalık geri sayım sayacı (5–120 dk aralığında ayarlanabilir).
  - **Başlat / Duraklat / Sıfırla** butonları.
  - Seans başlamadan önce kategori seçimi:
    - Örn: *Ders Çalışma, Kodlama, Proje, Kitap Okuma* vb.
  - Kullanıcının kendi kategorisini ekleyebilmesi.
  - Her seans için kısa bir **hedef (goal)** yazabilme alanı.
  - Seans bittikten veya durdurulduktan sonra:
    - Süre, kategori, dikkat dağınıklığı sayısı ve varsa hedef bilgisi ile
      **seans özeti** gösterilir.

- **Dikkat Dağınıklığı Takibi (AppState + Buton)**
  - Sayaç çalışırken kullanıcı uygulamadan çıkarsa (AppState `background`):
    - Seans otomatik olarak duraklatılır.
    - Dikkat dağınıklığı sayacı 1 artırılır.
  - Kullanıcı uygulamaya geri döndüğünde:
    - “Devam etmek ister misin?” sorusu gösterilir.
  - Kullanıcı, “Dikkatim dağıldı” butonuna basarak da manuel olarak
    dikkat dağınıklığı sayısını artırabilir.

- **Raporlar (Dashboard) Ekranı**
  - **Veri tabanına (AsyncStorage)** kaydedilmiş tüm seans verileri okunur.
  - Genel istatistikler:
    - Bugün Toplam Odaklanma Süresi
    - Tüm Zamanların Toplam Odaklanma Süresi
    - Toplam Dikkat Dağınıklığı Sayısı
  - **Grafikler** (react-native-chart-kit ile):
    - Son 7 güne ait odaklanma sürelerini gösteren **Çubuk Grafik (Bar Chart)**.
    - Odaklanma sürelerinin kategorilere göre dağılımını gösteren
      **Pasta Grafik (Pie Chart)**.

- **Geçmiş (History) Ekranı**
  - Tüm seanslar tarih sırasına göre listelenir.
  - Her kayıt için:
    - Tarih – saat
    - Kategori
    - Süre
    - Dikkat dağınıklığı sayısı
    - (Varsa) seans hedefi
    - Seansın bitiş nedeni (süre doldu / kullanıcı durdurdu vb.)

- **Veri Saklama (Yerel Veri Tabanı – AsyncStorage)**
  - Her seans tamamlandığında JSON formatında bir kayıt oluşturulur.
  - Bu kayıtlar cihazda yerel olarak `@sessions` anahtarında saklanır.
  - Raporlar ve Geçmiş ekranı bu kayıtlardan beslenir.

---

## Kullanılan Teknolojiler

- **React Native** (Expo ile)
- **Expo CLI**
- **React Navigation**
  - `@react-navigation/native`
  - `@react-navigation/bottom-tabs`
- **AsyncStorage**
  - `@react-native-async-storage/async-storage`
- **Grafikler**
  - `react-native-chart-kit`
  - `react-native-svg`
- Diğer Expo/React Native bileşenleri:
  - `expo-status-bar`, `react-native-screens`, `react-native-safe-area-context` vb.

---

## Kurulum ve Çalıştırma

Aşağıdaki adımlar, projeyi yerel ortamda çalıştırmak içindir.

### 1. Gerekli Araçlar

- [Node.js](https://nodejs.org/) (LTS sürümü önerilir)
- `npm` veya `yarn`
- [Expo Go](Android/iOS) uygulaması (fiziksel cihazda test için)
- Git (repository'i klonlamak için)

### 2. Projeyi Klonlama

```bash
git clone <REPO_LINKIN>
cd <REPO_KLASORUN>
