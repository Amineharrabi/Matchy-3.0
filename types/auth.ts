import { AuthRequestConfig, AuthSessionResult, TokenResponse } from 'expo-auth-session';

export interface SpotifyTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
