"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations, type Language } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (
    keyPath: string,
    fallbackOrParams?: Record<string, string | number> | string,
    params?: Record<string, string | number>
  ) => string;
  strings: (typeof translations)["en"];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "tsunagu_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === "en" || stored === "ja") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      } else {
        // Detect browser language if present
        const navLang = navigator.language?.toLowerCase();
        if (navLang?.startsWith("ja")) {
          setLanguageState("ja");
          document.documentElement.lang = "ja";
        }
      }
    } catch {
      // Ignore localStorage access restrictions
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore localStorage access restrictions
    }
  }, []);

  const currentStrings = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  // Key resolver for nested string paths like "hero.badge" or "nav.posts"
  const t = useCallback(
    (
      keyPath: string,
      fallbackOrParams?: Record<string, string | number> | string,
      params?: Record<string, string | number>
    ): string => {
      const keys = keyPath.split(".");
      let val: any = translations[language];

      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }

      // Fallback to English if key missing in current language
      if (val === undefined) {
        let fallbackVal: any = translations.en;
        for (const k of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && k in fallbackVal) {
            fallbackVal = fallbackVal[k];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        val = fallbackVal;
      }

      // Determine the base text: resolved translation string, or fallback string, or keyPath
      let text = typeof val === "string" ? val : typeof fallbackOrParams === "string" ? fallbackOrParams : keyPath;

      // Extract parameter dictionary
      const interpolationParams =
        typeof fallbackOrParams === "object" && fallbackOrParams !== null ? fallbackOrParams : params;

      if (interpolationParams) {
        for (const [pKey, pVal] of Object.entries(interpolationParams)) {
          text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
        }
      }

      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        strings: currentStrings,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return safe fallback for components rendered outside LanguageProvider
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (keyPath: string) => keyPath,
      strings: translations.en,
    };
  }
  return context;
}
