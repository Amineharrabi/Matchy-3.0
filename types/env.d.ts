declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SPOTIFY_CLIENT_ID: string;
      EXPO_PUBLIC_SPOTIFY_REDIRECT_URI: string;
      EXPO_PUBLIC_NEWS_API_KEY: string;
      EXPO_PUBLIC_DEVELOPER_EMAIL: string;
    }
  }
}

export {};