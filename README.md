# 🏛️ Herculethes 2.0  
### The Ultimate Modern Fitness Tracker

---

## 🧩 Description

**Herculethes 2.0** (codenamed **Olympus**) is a full-stack progressive web application built to help athletes, gym-goers, and fitness enthusiasts **track workouts, monitor progress, and visualize performance** — all in one sleek, cloud-powered dashboard.

Rebuilt from the ground up with **React + Vite + Tailwind**, it integrates deeply with **Firebase** for authentication, real-time data sync, and media storage, along with **Google Maps API** for location-based fitness experiences.

The app is **mobile-first**, fully responsive, and deployable instantly via **Vercel**.

---

## 🚀 Core Features

✅ **Workout Tracking** – Log sets, reps, weights, and exercises in real time  
✅ **Cloud Sync** – Automatically save all data to Firestore  
✅ **Media Uploads** – Attach photos/videos to workouts (Firebase Storage)  
✅ **Progress Dashboard** – Visualize total volume, duration, and muscle splits  
✅ **Run Tracker** – Use GPS + Maps API to record outdoor runs  
✅ **Gym Finder** – Discover nearby gyms with live geolocation  
✅ **Meal Planner** – Generate nutrition-balanced meals (Spoonacular API)  
✅ **Authentication** – Secure signup/login with Firebase Auth  
✅ **Responsive UI** – Tailwind-powered mobile design  
✅ **Workout Management** – View, delete, and soon reuse templates  

---

## ⚙️ Installation & Setup

### 🧱 Prerequisites
- Node.js (v18 or higher)  
- npm (v9 or higher)  
- Firebase account + project  
- Google Maps API Key  

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/herculethes2.0.git
cd herculethes2.0
```  

### 2️⃣ Install Dependencies
```bash
npm install
```
3️⃣ Configure Environment Variables

Create a .env file in the root directory:
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
```
🔐 Never commit your .env file to GitHub.

4️⃣ Run the Application
```bash
npm run dev
```
Then visit 👉 http://localhost:5173

5️⃣ Deploy on Vercel

1. Push your code to GitHub

2. Import the repo to Vercel

3. Add all .env variables under
Project → Settings → Environment Variables

4. Click Deploy 🚀

## 🔥 Firebase Setup

1. Go to Firebase Console

2. create Project → Add a Web App → copy config values

3. Enable the following services:

.🔐 Authentication → Email/Password

.🗄️ Firestore Database → Start in Production Mode

.🖼️ Storage → Enable

4.Update your .env with the Firebase config

5. Optionally enable Hosting or Cloud Functions later

## 💪 Application Usage

Once running, you can:

.🔑 Register / Login securely with Firebase Auth

.🏋️ Log workouts (exercises, sets, reps, weights)

.📸 Upload media for each workout

.📊 View progress (volume, duration, sets)

.🗺️ Explore local gyms using Google Maps

.🍽️ Plan meals with AI-powered Spoonacular suggestions

.🗂️ Manage workouts – view, delete, or (soon) reuse templates

## 🧭 Project Architecture
```bash
src/
 ┣ components/        → Reusable UI components (cards, charts, etc.)
 ┣ pages/             → Page-level components (Home, Profile, SaveWorkout…)
 ┣ auth/              → Auth context & user session logic
 ┣ firebase.ts        → Firebase config & exports
 ┣ assets/            → Images (Olympus art, icons, etc.)
 ┣ types/             → Shared TypeScript interfaces
 ┗ main.tsx           → Vite entry point
```
## 🌍 APIs Used
Service	Purpose
Firebase Auth & Firestore	Secure, scalable user + data management
Firebase Storage	Workout media uploads
Google Maps API	Map display, nearby gyms, route tracking
Spoonacular API	Meal & nutrition data
## 🏆 Acknowledgements

Firebase Team — Cloud platform & backend services

Google Maps Platform — Geolocation & mapping APIs

Spoonacular API — Meal planning and nutrition data

Vercel — Fast and secure frontend deployment
