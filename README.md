# rork-streamshield

StreamShield is a privacy-focused tool for Spotify users. It helps prevent your listening activity from influencing Spotify's recommendation algorithms by shielding your sessions and managing a special playlist excluded from your taste profile.

## Features
- Activate a "shield" to protect your listening sessions
- Add tracks to a special playlist excluded from recommendations
- Manage blacklists, rules, and session durations
- View listening stats and history
- Modern React Native/Expo app with TypeScript

## Setup Instructions
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd rork-streamshield
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Add your Spotify Client ID to `app.json` under `extra.EXPO_PUBLIC_SPOTIFY_CLIENT_ID`.
   - Make sure to add your redirect URI to your Spotify Developer Dashboard.
4. **Start the app:**
   ```sh
   npm start
   ```
   - For web: `npm run start-web`

## Usage
- Log in with your Spotify account.
- Activate the shield to start a protected session.
- Use the app to manage your blacklists, rules, and view stats.
- Copy and add the provided redirect URI to your Spotify app settings if prompted.

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes and add tests if applicable
4. Submit a pull request with a clear description

## License
MIT

---
