import Constants from 'expo-constants';

// Evaluated lazily so it always reflects the current Expo hostUri.
// Falls back to the fixed LAN IP when running as a standalone/production build.
const getDevHost = () =>
  Constants.expoConfig?.hostUri?.split(':')[0] ?? '192.168.68.117';

export const getApiBaseUrl = () => `http://${getDevHost()}:3000/api/v1`;
export const getSocketUrl = () => `http://${getDevHost()}:3000`;

// Static exports kept for backwards-compat — resolved once at startup.
// All internal helpers should prefer the getters above.
export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();
