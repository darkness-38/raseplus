# 🌌 Rase+ | Ultimate Streaming Experience

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**Rase+** is a premium, high-performance movie and series streaming platform built with the latest web technologies. It combines a stunning Netflix-inspired UI with advanced video scraping capabilities and real-time user profile management.

---

## ✨ Key Features

### 🎬 Cinematic Discovery
- **TMDB Integration**: Seamlessly pulls the latest movie and series data, including high-res posters, backdrops, and detailed metadata.
- **Dynamic Rows**: Intelligent categorization (Trending, Top Rated, Now Playing) for effortless content discovery.
- **Hero Banners**: Engaging homepage spotlight for featured content with smooth transitions.

### 🎥 Elite Video Playback
- **Multi-Source Support**: Choose between three high-speed video sources, including specialized Turkish scrapers.
- **HLS.js Power**: Flawless streaming of M3U8/Adaptive Bitrate content for the best possible quality.
- **Custom Player UI**: Beautiful, responsive player controls with fullscreen support and intuitive navigation.
- **Continue Watching**: Automatically resumes content exactly where you left off.

### 👤 Personalized Profiles
- **Profile System**: Create up to 10 unique profiles with custom avatars.
- **Watchlist & Liked**: Personalized collections for every user profile.
- **Real-time Sync**: Powered by Firebase for instant updates across devices.

### 🛠️ Advanced Backend
- **Intelligent Scrapers**: Custom scrapers for `FullHDFilmizlesene` and `HDFilmcehennemi` to provide high-quality localized content.
- **Video Proxy**: Built-in proxy to handle CORS and provide a seamless streaming experience regardless of the source.
- **Admin Dashboard**: Comprehensive management tools for site content and users.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI/UX**: [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Auth & DB**: [Firebase](https://firebase.google.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Video Library**: [HLS.js](https://github.com/video-dev/hls.js/)
- **Scraping Engine**: [Cheerio](https://cheerio.js.org/), [jsdom](https://github.com/jsdom/jsdom)

---

## 🛠️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/raseplus.git
   cd raseplus
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file and add your keys:
   ```env
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_key
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   ...
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to start browsing!

---

## 📂 Project Structure

```text
src/
├── app/             # App Router pages & API routes
├── components/      # Reusable UI components
├── context/         # Auth & Global contexts
├── lib/             # API integrations & helper functions
├── store/           # Zustand state management
└── types/           # Global TypeScript definitions
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<p align="center">
  Made with ❤️ by the Rase+ Team
</p>
