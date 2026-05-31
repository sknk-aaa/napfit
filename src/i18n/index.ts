import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ja } from './ja';
import { en } from './en';

const dictionaries = { ja, en };

export type Lang = keyof typeof dictionaries; // 'ja' | 'en'
export type LangPref = 'system' | Lang;
export type Translations = typeof ja | typeof en;

const STORAGE_KEY = 'settings:locale_pref';

function detectSystemLang(): Lang {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'ja' ? 'ja' : 'en';
}

type LocaleContextValue = {
  lang: Lang;
  pref: LangPref;
  setPref: (pref: LangPref) => void;
  t: Translations;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<LangPref>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'system' || stored === 'ja' || stored === 'en') {
        setPrefState(stored);
      }
    });
  }, []);

  function setPref(next: LangPref) {
    setPrefState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const lang: Lang = pref === 'system' ? detectSystemLang() : pref;
  const t = dictionaries[lang];

  const value = useMemo<LocaleContextValue>(
    () => ({ lang, pref, setPref, t }),
    [lang, pref, t]
  );

  return createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export function useT(): Translations {
  return useLocale().t;
}
