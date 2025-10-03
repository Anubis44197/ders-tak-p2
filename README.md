
<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Eğitim Asistanı (AI Destekli Ebeveyn Paneli)

Bu proje, ebeveynlerin çocuklarının akademik gelişimini takip etmelerini ve çocukların öğrenme süreçlerini desteklemeyi amaçlayan modern bir eğitim platformu arayüzüdür. Yapay zeka destekli analizler, görev yönetimi, ödül sistemi ve detaylı raporlama gibi birçok özellik sunar.

## İçindekiler
- [Eğitim Asistanı (AI Destekli Ebeveyn Paneli)](#eğitim-asistanı-ai-destekli-ebeveyn-paneli)
  - [İçindekiler](#i̇çindekiler)
  - [Özellikler](#özellikler)
  - [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
  - [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
    - [Gereksinimler](#gereksinimler)
    - [Adımlar](#adımlar)
  - [Klasör Yapısı](#klasör-yapısı)
    - [Önemli Klasörler ve Dosyalar](#önemli-klasörler-ve-dosyalar)
  - [Ana Bileşenler ve Özellikler](#ana-bileşenler-ve-özellikler)
  - [Katkı ve Geliştirme](#katkı-ve-geliştirme)
  - [Lisans](#lisans)

## Özellikler
- **Görev Yönetimi:** Çocuğa ders, kitap okuma veya soru çözme görevleri atama ve takip etme
- **Ders Yönetimi:** Ders ekleme, silme ve analiz
- **Performans Analizi:** Başarı ve odak puanları, haftalık/aylık/yıllık grafikler
- **Yapay Zeka Destekli Raporlar:** AI ile özet, öneri ve konu analizi
- **Ödül Sistemi:** Puan biriktirme ve ödül kazanma
- **Günlük Özet:** AI ile ebeveyne özel günlük özet ve öneriler
- **Modern ve Duyarlı Arayüz:** React + Tailwind CSS ile responsive tasarım

## Kullanılan Teknolojiler
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Recharts](https://recharts.org/) (grafikler için)
- [@google/genai](https://www.npmjs.com/package/@google/genai) (Yapay zeka entegrasyonu)

## Kurulum ve Çalıştırma

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18+ önerilir)

### Adımlar
1. Bağımlılıkları yükleyin:
   ```shell
   npm install
   ```
2. [Google Gemini API](https://ai.google.dev/) anahtarınızı alın ve proje köküne `.env.local` dosyası oluşturup aşağıdaki satırı ekleyin:
   ```env
   GEMINI_API_KEY=YOUR_API_KEY_HERE
   ```
3. Uygulamayı başlatın:
   ```shell
   npm run dev
   ```
4. Tarayıcıda [http://localhost:5173](http://localhost:5173) adresini açın.

## Klasör Yapısı

```
uygulma/
├── App.tsx
├── components/
│   ├── icons.tsx
│   ├── child/
│   ├── parent/
│   └── shared/
├── src/
├── types.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── ...
```

### Önemli Klasörler ve Dosyalar
- `components/parent/ParentDashboard.tsx`: Ebeveyn panelinin ana bileşeni
- `components/child/`: Çocuk paneli ve ilgili bileşenler
- `components/shared/`: Ortak kullanılan bileşenler (ör. EmptyState)
- `types.ts`: Tip tanımlamaları
- `package.json`: Bağımlılıklar ve scriptler

## Ana Bileşenler ve Özellikler
- **ParentDashboard.tsx:**
  - Görev yönetimi, ders yönetimi, performans analizleri, AI raporları, ödül yönetimi ve günlük özet
- **TaskManager:** Görev ekleme, filtreleme, sıralama ve silme
- **PerformanceAnalytics:** Zaman aralığına göre başarı ve odak puanı analizleri, AI ile konu analizi
- **ReportsView:** AI ile haftalık/aylık/yıllık performans raporları ve trend grafikleri
- **RewardsManager:** Ödül ekleme ve silme, puan yönetimi
- **DailyBriefing:** AI ile ebeveyne özel günlük özet ve öneriler

## Katkı ve Geliştirme
Katkıda bulunmak için lütfen bir fork oluşturun ve pull request açın. Kodunuzu göndermeden önce aşağıdaki adımları izleyin:

1. Kodunuzu test edin ve çalıştığından emin olun.
2. Kod stiline ve proje yapısına uygunluk sağlayın.
3. Açıklayıcı commit mesajları kullanın.
4. Gerekirse yeni testler ekleyin.

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Ayrıntılar için [LICENSE](./LICENSE) dosyasına bakınız.
