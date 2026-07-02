import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types';
import { API_BASE_URL } from '../api/config';

const BASE = API_BASE_URL.replace('/api/v1', '');
const toAbs = (url?: string) =>
  url && url.startsWith('/') ? `${BASE}${url}` : url;

function normalizeUser(user: User): User {
  return {
    ...user,
    avatarUrl: toAbs(user.avatarUrl) ?? user.avatarUrl,
    bannerUrl: toAbs(user.bannerUrl) ?? user.bannerUrl,
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
  setLoading: (loading: boolean) => void;
  initSecureTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,

      // Load tokens into memory on startup.
      // On web: tokens come from zustand persist (AsyncStorage) — wait for hydration instead.
      // On native: tokens are in SecureStore, not persisted by zustand.
      initSecureTokens: async () => {
        if (Platform.OS === 'web') {
          // Tokens are already rehydrated by zustand persist on web — nothing to do.
          return;
        }
        try {
          const token = await SecureStore.getItemAsync('accessToken');
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          if (token && refreshToken) {
            set({ token, refreshToken, isAuthenticated: true });
          }
        } catch (e) {
          console.error('Failed to load secure tokens', e);
        }
      },

      login: async (user, token, refreshToken) => {
        try {
          if (Platform.OS === 'web') {
            await AsyncStorage.setItem('accessToken', token);
            await AsyncStorage.setItem('refreshToken', refreshToken);
          } else {
            await SecureStore.setItemAsync('accessToken', token);
            await SecureStore.setItemAsync('refreshToken', refreshToken);
          }
          set({ user: normalizeUser(user), token, refreshToken, isAuthenticated: true });
        } catch (e) {
          console.error('Failed to store secure tokens', e);
        }
      },

      logout: async () => {
        try {
          if (Platform.OS === 'web') {
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
          } else {
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
          }
        } catch (e) {
          console.error('Failed to delete secure tokens', e);
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? normalizeUser({ ...state.user, ...updates }) : null,
        })),

      completeOnboarding: () => set({ isOnboarded: true }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'community-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        ...(Platform.OS === 'web' ? { token: state.token, refreshToken: state.refreshToken, isAuthenticated: state.isAuthenticated } : {}),
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.user = normalizeUser(state.user);
        }
      },
    }
  )
);

// Resolves once zustand persist has finished rehydrating from AsyncStorage.
// Must be defined after useAuthStore.
export const waitForHydration = (): Promise<void> =>
  new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) { resolve(); return; }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
