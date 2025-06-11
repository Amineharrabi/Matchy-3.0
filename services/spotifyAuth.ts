import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { encode as base64Encode } from 'base-64';
import '../types/auth';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

// Define all possible redirect URIs
const REDIRECT_URIS = {
  EXPO_PROXY: 'https://auth.expo.io/@amineharrabi/matchy',
  DEVELOPMENT: 'exp://192.168.1.8:8081/spotify-auth-callback',
  PRODUCTION: 'matchy://spotify-auth-callback'
};

const getBasicAuth = () => {
  return base64Encode(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
};

const getRedirectUri = () => {
  if (__DEV__) {
    // For development, use the exact URI we registered
    return REDIRECT_URIS.DEVELOPMENT;
  } else {
    // For production, use the production URI
    return REDIRECT_URIS.PRODUCTION;
  }
};


const REDIRECT_URI = getRedirectUri();

console.log('Development mode:', __DEV__);
console.log('Using Redirect URI:', REDIRECT_URI);


const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
} as AuthSession.DiscoveryDocument;

const SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-follow-read',
  'user-read-playback-state',
  'user-modify-playback-state'
];

export class SpotifyAuth {
  private static instance: SpotifyAuth;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiryTime: number | null = null;
  private initialized: boolean = false;

  private constructor() { }

  static getInstance(): SpotifyAuth {
    if (!SpotifyAuth.instance) {
      SpotifyAuth.instance = new SpotifyAuth();
    }
    return SpotifyAuth.instance;
  }

  async init() {
    if (this.initialized) return;

    try {
      const storedAccessToken = await SecureStore.getItemAsync('spotify_access_token');
      const storedRefreshToken = await SecureStore.getItemAsync('spotify_refresh_token');
      const storedExpiryTime = await SecureStore.getItemAsync('spotify_expiry_time');

      if (storedAccessToken && storedRefreshToken && storedExpiryTime) {
        this.accessToken = storedAccessToken;
        this.refreshToken = storedRefreshToken;
        this.expiryTime = parseInt(storedExpiryTime);

        // Check if token needs refresh
        if (this.shouldRefreshToken()) {
          await this.refreshAccessToken();
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      throw error;
    }
  }

  private shouldRefreshToken(): boolean {
    if (!this.accessToken || !this.expiryTime) return true;
    // Refresh if token expires in less than 5 minutes
    return Date.now() >= (this.expiryTime - 300000);
  }

  async login(): Promise<boolean> {
    try {
      await this.init();

      const request = new AuthSession.AuthRequest({
        responseType: AuthSession.ResponseType.Code,
        clientId: SPOTIFY_CLIENT_ID!,
        scopes: SCOPES,
        usePKCE: true,
        redirectUri: REDIRECT_URI,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      await request.makeAuthUrlAsync(discovery);

      console.log('Authorization URL:', request.url);
      console.log('Code Verifier:', request.codeVerifier);
      console.log('Redirect URI:', REDIRECT_URI);

      // In development, use the auth proxy, in production use direct auth
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        const tokenResponse = await this.exchangeCodeForTokens(
          result.params.code,
          request.codeVerifier!
        );

        if (tokenResponse) {
          await this.storeTokens(tokenResponse);
          return true;
        }
      }

      console.log('Auth failed:', result);
      return false;
    } catch (error) {
      console.error('Spotify login error:', error);
      return false;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      await this.init();

      if (!this.accessToken) return null;

      if (this.shouldRefreshToken()) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) return null;
      }

      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  private async storeTokens(tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
    try {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.expiryTime = Date.now() + (tokens.expiresIn * 1000);

      await Promise.all([
        SecureStore.setItemAsync('spotify_access_token', tokens.accessToken),
        SecureStore.setItemAsync('spotify_refresh_token', tokens.refreshToken),
        SecureStore.setItemAsync('spotify_expiry_time', this.expiryTime.toString())
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string) {
    try {
      const tokenRequest = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID!,
        code_verifier: codeVerifier,
      });

      console.log('Token request params:', tokenRequest.toString());

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getBasicAuth()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenRequest.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return null;
      }

      const data = await response.json();
      return data.access_token ? {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      } : null;
    } catch (error) {
      console.error('Token exchange error:', error);
      return null;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getBasicAuth()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: SPOTIFY_CLIENT_ID!,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token refresh failed:', errorData);
        return false;
      }

      const data = await response.json();
      if (data.access_token) {
        await this.storeTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token || this.refreshToken,
          expiresIn: data.expires_in,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async logout() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.expiryTime = null;
      this.initialized = false;

      await Promise.all([
        SecureStore.deleteItemAsync('spotify_access_token'),
        SecureStore.deleteItemAsync('spotify_refresh_token'),
        SecureStore.deleteItemAsync('spotify_expiry_time')
      ]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  isLoggedIn(): boolean {
    return this.accessToken !== null;
  }
}