# 🎬 Rase+ — The Ultimate Cinematic Experience

![Rase+ Banner](public/raseplus_banner_v2.png)

> **Experience movies and series like never before.** A high-performance, feature-rich streaming platform built with **Next.js 16**, **Tailwind CSS 4**, and **Firebase**.

---

## 🚀 Overview

**Rase+** is a modern streaming application designed for visual excellence and seamless content discovery. It bridges the gap between premium UI/UX and complex video source integration, offering users a sleek way to enjoy their favorite content.

## ✨ Key Features

- 🎥 **Dynamic Catalogs**: Real-time movie and series data powered by **TMDB API**.
- 📺 **Advanced Video Player**: Built-in **HLS.js** support for high-quality adaptive bitrate streaming.
- 🇹🇷 **Turkish Source Integration**: Custom-built resilient scrapers for:
  - **Source 2** (FullHDFilmizlesene) - *Supports AJAX-obfuscated content decoding.*
  - **Source 3** (HDFilmcehennemi) - *Multi-source link extraction.*
- 👤 **Netflix-Style Profiles**: Manage multiple user profiles with unique preferences.
- 🔥 **Seamless Auth**: Real-time authentication and database sync via **Firebase**.
- ⚡ **Cutting-Edge Performance**: Optimized with **Next.js 16 App Router** and **Turbopack**.
- 🎨 **Premium UI**: Crafted with **Tailwind CSS 4** and **Framer Motion** for glassmorphism and fluid animations.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16** | Core Framework (App Router, Turbopack) |
| **React 19** | UI Library |
| **Tailwind CSS 4** | Ultra-modern Styling & PostCSS |
| **Framer Motion** | Micro-interactions & Page Transitions |
| **Firebase** | Authentication & Cloud Firestore |
| **Zustand** | Lightweight State Management |
| **HLS.js** | Advanced Video Playback |
| **Cheerio** | High-speed Scraper Engine |

---

## 📂 Project Structure

```text
raseplus/
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   │   ├── api/            # Scraper & Proxy backend routes
│   │   └── (routes)/       # Main application pages
│   ├── components/         # Reusable UI & Video Player components
│   ├── lib/                # Shared utilities and types
│   └── store/              # Zustand global state management
├── public/                 # Static assets & icons
└── tailwind.config.ts      # Tailwind CSS 4 configuration
```

---

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/darkness-38/raseplus.git
   cd raseplus
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file with your credentials:
   ```env
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_key
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   # ... add other firebase config fields
   ```

4. **Run in development Mode**:
   ```bash
   npm run dev
   ```

---

## 🛡️ Scraper Troubleshooting

If you encounter issues with **Source 2** or **Source 3**:
- **Status 451**: This indicates a legal/regional block by the provider for your server's IP.
- **Status 403**: Typically triggered by Cloudflare. Our scrapers include advanced headers and decoding, but IP reputation matters.
- **Solution**: Consider using a proxy or a different deployment region if your specific server IP is restricted.

---

## 🤝 Contributing & License

Contributions are welcome! Please feel free to submit a Pull Request.

**License**: [MIT](LICENSE)

---
*Created with ❤️ by the Rase+ Team*
<p align="center">
  <img src="https://img.shields.io/badge/Powered%20by-Next.js%2016-black?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Styled%20with-Tailwind%204-06B6D4?style=for-the-badge&logo=tailwindcss" />
</p>
