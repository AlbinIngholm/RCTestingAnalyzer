# RC Testing Analyzer

A web application for tracking RC (remote control) vehicle testing sessions. Users can manage tracks, log sessions with weather data, and record runs with performance metrics like best lap times, average lap times, and tire setups. Built with React, TypeScript, Firebase, and OpenWeatherMap API.

## Features
- **User Authentication**: Secure login/logout using Firebase Authentication.
- **Track Management**: Add, view, and delete tracks.
- **Session Tracking**: Create sessions with automatic weather data (temperature and condition) fetched via OpenWeatherMap.
- **Run Logging**: Record runs with best/average lap times, 5-minute stints, tire setups, and notes.
- **Real-Time Updates**: Data syncs in real-time using Firebase Firestore.
- **Responsive UI**: Works on desktop and mobile devices with a modern, gradient-themed design.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **API**: OpenWeatherMap (current weather data)
- **Build Tool**: Create React App
- **Version Control**: Git

## Prerequisites
- Node.js (v16 or higher recommended)
- npm (v8 or higher)
- A Firebase project with Authentication and Firestore enabled
- An OpenWeatherMap API key (free tier)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/AlbinIngholm/RCTestingAnalyzer.git
cd RCTestingAnalyzer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Firebase
1. Go to the Firebase Console.
2. Create a new project and enable Authentication (Email/Password) and Firestore.
3. Copy your Firebase config object from the project settings.
4. Create a `src/firebase.ts` file with the following:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```
Replace the placeholders with your Firebase config values.

### 4. Configure OpenWeatherMap API
1. Sign up at OpenWeatherMap and get an API key.
2. Create a `.env` file in the root directory:

```plaintext
REACT_APP_OPENWEATHERMAP_API_KEY=your-api-key-here
```
Ensure `.env` is listed in `.gitignore` to keep your key private.

### 5. Run the Application
```bash
npm start
```
The app will open in your browser at http://localhost:3000.

## Usage
1. **Sign In**: Log in with your email and password (set up via Firebase Authentication).
2. **Add a Track**: Enter a track name and click "Add Track".
3. **Create a Session**: Select a track, optionally name the session, and click "+ New Session". Weather data will auto-fetch based on your location.
4. **Log Runs**: Open a session, click "Add Run", and enter details like lap times and tire setups.
5. **Manage Data**: Delete tracks, sessions, or runs as needed.

## Project Structure
```
RCTestingAnalyzer/
├── public/            # Static assets (favicon, manifest, etc.)
├── src/               # Source code
│   ├── App.tsx        # Main application component
│   ├── firebase.ts    # Firebase configuration and initialization
│   ├── App.css        # Global styles
│   └── ...            # Other components and utilities
├── .env               # Environment variables (gitignored)
├── .gitignore         # Git ignore file
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Troubleshooting
- **401 Unauthorized (OpenWeatherMap)**: Ensure your API key is valid and activated. Check `.env` and restart the server.
- **Geolocation Errors**: Allow location access in your browser or use the "Use Default" option for fallback weather.
- **Firebase Issues**: Verify your `firebase.ts` config matches your Firebase project settings.

## Deployment
To deploy (e.g., to Netlify or Vercel):

1. Build the app:
```bash
npm run build
```
2. Deploy the `build/` directory.
3. Set the `REACT_APP_OPENWEATHERMAP_API_KEY` environment variable in your hosting platform’s settings.

## Contributing
Feel free to submit issues or pull requests to improve the project. Ensure you follow the existing code style and include tests where applicable.

## License
Copyright 2025 AlbinIngholm

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to use,
copy, modify, merge, publish, and distribute the Software, subject to the
following conditions:

Attribution: Any use, distribution, or modification of this software
must include credit to the original author, AlbinIngholm, with a link to
their GitHub profile: https://github.com/AlbinIngholm.

No Sale: This software may not be sold or included in any commercial
product for profit.

No Warranty: The Software is provided "as is", without warranty of any
kind, express or implied, including but not limited to the warranties of
merchantability, fitness for a particular purpose, and noninfringement. In
no event shall the author be liable for any claim, damages, or other
liability, whether in an action of contract, tort, or otherwise, arising
from, out of, or in connection with the Software.

By using this software, you agree to the above terms.

## Contact
For questions, reach out to `albin.ingholm@gmail.com`. 