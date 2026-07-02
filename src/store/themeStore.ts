import { create } from 'zustand';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  getIsDark: () => boolean;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'light', // Default to Light Mode
  setThemeMode: (mode) => set({ themeMode: mode }),
  getIsDark: () => {
    const { themeMode } = get();
    if (themeMode === 'system') {
      return Appearance.getColorScheme() === 'dark';
    }
    return themeMode === 'dark';
  },
}));
