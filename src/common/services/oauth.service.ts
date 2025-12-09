import { env } from '../../config/env.js';

export interface OAuthUserInfo {
  email: string;
  providerAccountId: string;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserResponse {
  id: string;
  email: string;
  name?: string;
}

export const getGoogleAuthUrl = (): string => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth not configured');
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.APP_URL}/auth/google/callback`,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

export const getGoogleUserInfo = async (
  code: string
): Promise<OAuthUserInfo> => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth not configured');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${env.APP_URL}/auth/google/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange Google code for tokens');
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  const userResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!userResponse.ok) {
    throw new Error('Failed to get Google user info');
  }

  const userInfo = (await userResponse.json()) as GoogleUserResponse;

  if (!userInfo.email) {
    throw new Error('Failed to get Google user info');
  }

  return {
    email: userInfo.email,
    providerAccountId: userInfo.id,
  };
};
