const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

type CachedToken = { accessToken: string; expiresAtMs: number };

let cached: CachedToken | null = null;

export const clearSpotifyTokenCache = (): void => {
  cached = null;
};

export const getSpotifyClientCredentialsToken = async (
  clientId: string,
  clientSecret: string
): Promise<string> => {
  const now = Date.now();
  if (cached && now < cached.expiresAtMs - 60_000) {
    return cached.accessToken;
  }
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body
  });
  if (!res.ok) {
    throw new Error('SpotifyAuthFailed');
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    accessToken: json.access_token,
    expiresAtMs: now + json.expires_in * 1000
  };
  return cached.accessToken;
};

export const spotifyAuthorizedGet = async <T>(
  url: string,
  clientId: string,
  clientSecret: string
): Promise<T> => {
  const token = await getSpotifyClientCredentialsToken(clientId, clientSecret);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`SpotifyApiError:${res.status}`);
  }
  return (await res.json()) as T;
};

export const spotifyApiGet = async <T>(
  path: string,
  clientId: string,
  clientSecret: string
): Promise<T> => {
  return await spotifyAuthorizedGet<T>(`https://api.spotify.com/v1${path}`, clientId, clientSecret);
};
