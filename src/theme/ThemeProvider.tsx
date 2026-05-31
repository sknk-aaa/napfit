import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lightColors, darkColors, type ThemeColors } from './colors';

export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'settings:theme_pref';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        setPrefState(stored);
      }
    });
  }, []);

  function setPref(next: ThemePref) {
    setPrefState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const isDark = pref === 'system' ? systemScheme === 'dark' : pref === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark, pref, setPref }),
    [colors, isDark, pref]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

// 各画面は `const styles = useThemedStyles(makeStyles)` で
// テーマ色を反映した StyleSheet を得る。makeStyles は (colors) => StyleSheet.create({...})。
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
