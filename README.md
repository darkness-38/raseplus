# 🎬 Rase+ 

<div align="center">
  <img src="https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
</div>

<br />

> **The Ultimate Cinematic Experience.** A high-performance, feature-rich streaming platform that bridges the gap between premium UI/UX and complex video source integration.

---

## 🚀 Overview

**Rase+** is a modern streaming application designed for visual excellence and seamless content discovery. It offers users a sleek, intuitive, and responsive way to enjoy their favorite movies and TV shows, with a Netflix-style interface and seamless video playback from multiple external sources.

## ✨ Key Features

- 🎥 **Dynamic Catalogs**: Real-time movie and series data powered by the **TMDB API**.
- 📺 **Advanced Video Player**: Premium, high-performance player with support for multiple video sources (Vidsrc, AutoEmbed, etc.).
- 👤 **Netflix-Style Profiles**: Manage multiple user profiles with unique preferences per account.
- 🔥 **Seamless Authentication**: Secure real-time user authentication and database synchronization via **Firebase**.
- ⚡ **Cutting-Edge Performance**: Fully optimized with the **Next.js App Router** and **Turbopack** for lightning-fast loads.
- 🎨 **Premium UI/UX**: Crafted with **Tailwind CSS 4** and **Framer Motion** for glassmorphism effects, fluid animations, and a fully responsive layout.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 & PostCSS
- **Animations**: Framer Motion
- **Backend & Auth**: Firebase (Authentication & Cloud Firestore)
- **State Management**: Zustand
- **Video Playback**: HLS.js

---

## 📂 Project Structure

```text
raseplus/
├── src/
│   ├── app/                # Next.js App Router (Pages, API routes)
│   ├── components/         # Reusable UI & Video Player components
│   ├── lib/                # Shared utilities and types
│   └── store/              # Zustand global state management
├── public/                 # Static assets & icons
└── tailwind.config.ts      # Tailwind CSS 4 configuration
```

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

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
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Visit [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🤝 Contributing

Contributions are always welcome! Feel free to open an issue or submit a Pull Request if you'd like to improve the project.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---
*Created with ❤️ by the Rase+ Team*
