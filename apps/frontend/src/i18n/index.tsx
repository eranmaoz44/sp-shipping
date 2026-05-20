import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type TranslationKey } from "./en";
import { he } from "./he";

const STORAGE_KEY = "sp-shipping-language";

const dictionaries = {
  en,
  he,
} as const;

export type LanguageCode = keyof typeof dictionaries;

const getDirection = (language: LanguageCode): "ltr" | "rtl" => {
  return language === "he" ? "rtl" : "ltr";
};

const interpolate = (template: string, variables?: Record<string, string | number>): string => {
  if (!variables) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = variables[token];
    return value === undefined ? `{${token}}` : String(value);
  });
};

type I18nContextValue = {
  language: LanguageCode;
  direction: "ltr" | "rtl";
  setLanguage: (language: LanguageCode) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, variables?: Record<string, string | number>) => string;
  tRole: (role: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getInitialLanguage = (): LanguageCode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "he") {
    return stored;
  }
  return "en";
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<LanguageCode>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", getDirection(language));
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    const direction = getDirection(language);
    const dictionary = dictionaries[language];

    return {
      language,
      direction,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "en" ? "he" : "en")),
      t: (key, variables) => interpolate(dictionary[key], variables),
      tRole: (role) => {
        const roleKey = `roles.${role}` as TranslationKey;
        if (Object.prototype.hasOwnProperty.call(dictionary, roleKey)) {
          return dictionary[roleKey];
        }
        return role;
      },
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};
