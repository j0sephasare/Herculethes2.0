🏛️ Herculethes 2.0
The Ultimate Modern Fitness Tracker


🧩 Description

Herculethes 2.0 (codenamed Olympus) is a full-stack progressive web application built to help athletes, gym-goers, and fitness enthusiasts track their workouts, monitor progress, and visualize performance — all in one sleek, cloud-powered dashboard.

Rebuilt from the ground up using React + Vite + Tailwind, it features deep Firebase integration for secure authentication, real-time data sync, and media storage, along with Google Maps API for location-based fitness experiences.

The app is fully responsive and optimized for mobile use — deployable directly via Vercel.


🚀 Core Features

✅ Workout Tracking – Log sets, reps, weights, and exercises in real time
✅ Cloud Sync – Save all workout data to Firestore instantly
✅ Media Uploads – Attach photos/videos to each workout (stored in Firebase Storage)
✅ Progress Dashboard – View total volume, duration, muscle group splits, and trends
✅ Run Tracker – Use GPS & Google Maps API to visualize outdoor runs
✅ Gym Finder – Find nearby gyms using live geolocation
✅ Meal Planner – Generate nutrition-balanced meals (via Spoonacular API integration)
✅ Authentication – Secure signup/login with Firebase Auth
✅ Responsive UI – Optimized for all screen sizes
✅ Workout Deletion & Management – Edit or remove workouts seamlessly

⚙️ Installation & Setup
🧱 Prerequisites

Node.js (v18 or higher)

npm (v9 or higher)

Firebase account & project

Google Maps API Key

1️⃣ Clone the Repository
git clone https://github.com/yourusername/herculethes2.0.git
cd herculethes2.0

2️⃣ Install Dependencies
npm install

3️⃣ Configure Environment Variables

Create a .env file in the root directory:

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key


🔐 Never commit .env to GitHub.

4️⃣ Run the Application
npm run dev


Then visit 👉 http://localhost:5173

5️⃣ Deploy on Vercel

Push your code to GitHub

Import the repo to Vercel

Add the same .env variables under Project → Settings → Environment Variables

Deploy 🚀

🔥 Firebase Setup

Go to Firebase Console
 → Create Project

Add a Web App → copy your config values

Enable:

Authentication → Email/Password

Firestore Database → Start in Production Mode

Storage → Enable

Update .env with your Firebase config

Optionally enable Hosting or Cloud Functions later for advanced features

💪 Application Usage

Once running, you can:

Register / Login securely with Firebase Auth

Log Workouts with exercises, sets, reps, and weights

Upload Media to attach photos/videos to workouts

View Stats on your progress dashboard (total volume, duration, sets)

Explore Gyms near your area with Google Maps

Plan Meals with AI-powered Spoonacular suggestions

Manage Workouts – view, delete, and soon, reuse templates

🧭 Project Architecture
src/
 ┣ components/        → Reusable UI components (cards, charts, etc.)
 ┣ pages/             → Page-level components (Home, Profile, SaveWorkout…)
 ┣ auth/              → Auth context & user session logic
 ┣ firebase.ts        → Firebase configuration & exports
 ┣ assets/            → Images (Olympus art, icons, etc.)
 ┣ types/             → Shared TypeScript interfaces
 ┗ main.tsx           → Vite entry point

🌍 APIs Used

Firebase Auth & Firestore — Secure, scalable user + data management

Firebase Storage — Workout media uploads

Google Maps API — Map display, nearby gyms, route tracking

Spoonacular API — Meal & nutrition data


🏆 Acknowledgements

Firebase Team — Cloud platform

Google Maps Platform — Map and geolocation services

Spoonacular — Nutrition and meal planning API

Vercel — Seamless frontend deployment
