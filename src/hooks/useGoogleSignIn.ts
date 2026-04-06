import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResult {
  idToken?: string;
  accessToken?: string;
  success: boolean;
  error?: string;
}

export const useGoogleSignIn = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const redirectUrl = AuthSession.getRedirectUrl();

  // Get Google's discovery document
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // Create OAuth request
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId || '',
      scopes: ['profile', 'email', 'openid'],
      redirectUrl: redirectUrl,
      usePKCE: true,
    },
    discovery
  );

  const signIn = useCallback(async (): Promise<GoogleAuthResult> => {
    try {
      // Debug: Check if configured
      if (!clientId) {
        const msg = 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not configured. Add to .env.local';
        console.warn(msg);
        setError(msg);
        setDebugInfo(`Missing Client ID\nRedirect URL: ${redirectUrl}`);
        return { success: false, error: msg };
      }

      if (!discovery) {
        const msg = 'Google discovery document not loaded. Check internet connection.';
        console.warn(msg);
        setError(msg);
        setDebugInfo('Discovery document loading...');
        return { success: false, error: msg };
      }

      if (!request) {
        const msg = 'Auth request not initialized';
        console.warn(msg);
        setError(msg);
        return { success: false, error: msg };
      }

      console.log('Launching Google OAuth...');
      setIsLoading(true);
      setDebugInfo('Opening Google Sign-In...');

      // Launch the OAuth flow
      const result = await promptAsync();

      console.log('OAuth Result:', result?.type);

      if (result?.type === 'success') {
        const { id_token, id_Token, idToken, access_token } = result.params as any;
        const token = id_token || id_Token || idToken || access_token;

        if (!token) {
          const msg = 'No token received from Google. Params: ' + JSON.stringify(result.params);
          console.error(msg);
          setError(msg);
          return { success: false, error: msg };
        }

        console.log('✅ Google Sign-In successful');
        setError(null);
        setDebugInfo('Login successful!');
        return {
          success: true,
          idToken: token,
          accessToken: token,
        };
      } else if (result?.type === 'dismiss') {
        console.log('User cancelled Google Sign-In');
        setDebugInfo('User cancelled');
        return { success: false, error: 'User cancelled' };
      } else {
        const msg = `Auth failed. Type: ${result?.type}`;
        console.error(msg);
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      console.error('Google Sign-In error:', err);
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [clientId, discovery, request, promptAsync, redirectUrl]);

  return {
    signIn,
    error,
    isLoading,
    isAvailable: !!clientId && !!discovery,
    debugInfo,
    clientId,
    redirectUrl,
  };
};


