// hooks/useSpotifyAuth.ts
// React wrapper around services/auth.ts.
// Manages auth state and exposes login/logout to the UI.

import { useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import {
  buildAuthRequest,
  exchangeCodeForToken,
  saveToken,
  loadToken,
  clearToken,
} from '@/services/auth';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  token:   string | null;
  loading: boolean;
  ready:   boolean;  // true once initial SecureStore check is done
}

export function useSpotifyAuth() {
  const [state, setState] = useState<AuthState>({
    token:   null,
    loading: false,
    ready:   false,
  });

  // On mount: check SecureStore for an existing token
  useEffect(() => {
    loadToken().then((token: string | null) => {
      setState({ token, loading: false, ready: true });
    });
  }, []);

  const login = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const { url, verifier } = await buildAuthRequest();

      const result = await WebBrowser.openAuthSessionAsync(url, 'needledrop://spotify-auth');

      if (result.type !== 'success' || !result.url) {
        setState(s => ({ ...s, loading: false }));
        return;
      }

      // Extract the code from the redirect URL
      const redirectUrl  = new URL(result.url);
      const code         = redirectUrl.searchParams.get('code');
      const errorParam   = redirectUrl.searchParams.get('error');

      if (errorParam || !code) {
        throw new Error(errorParam || 'No code returned from Spotify');
      }

      const token = await exchangeCodeForToken(code, verifier);
      await saveToken(token);
      setState({ token, loading: false, ready: true });

    } catch (err) {
      console.error('[Auth] Login failed:', err);
      setState(s => ({ ...s, loading: false }));
      throw err;  // let the UI handle the error display
    }
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setState({ token: null, loading: false, ready: true });
  }, []);

  return {
    token:   state.token,
    loading: state.loading,
    ready:   state.ready,
    isAuthenticated: state.token !== null,
    login,
    logout,
  };
}
