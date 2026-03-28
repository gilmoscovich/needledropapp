// services/auth.ts
// Pure auth logic — no React, no hooks.
// The hook (useSpotifyAuth) wraps this.

import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!;
const SCOPES = [
  'user-read-private',
  'user-library-read',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
];

const TOKEN_KEY = 'nd_access_token';
const USER_KEY  = 'nd_user_id';

// ─── PKCE helpers ────────────────────────────────────────────────────────────

async function generateCodeVerifier(): Promise<string> {
  const random = await Crypto.getRandomBytesAsync(64);
  return btoa(String.fromCharCode(...random))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, 128);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ─── Auth URL ─────────────────────────────────────────────────────────────────

export async function buildAuthRequest(): Promise<{
  url: string;
  verifier: string;
}> {
  const redirectUri = AuthSession.makeRedirectUri({ native: 'needledrop://callback' });
  console.log('[auth] redirectUri:', redirectUri);
  const verifier   = await generateCodeVerifier();
  const challenge  = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          redirectUri,
    scope:                 SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge:        challenge,
  });

  return {
    url:      `https://accounts.spotify.com/authorize?${params.toString()}`,
    verifier,
  };
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForToken(
  code: string,
  verifier: string
): Promise<string> {
  const redirectUri = AuthSession.makeRedirectUri({ native: 'needledrop://callback' });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      client_id:     CLIENT_ID,
      code_verifier: verifier,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || `Token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error('No access_token in response');
  return data.access_token as string;
}

// ─── SecureStore helpers ──────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}
