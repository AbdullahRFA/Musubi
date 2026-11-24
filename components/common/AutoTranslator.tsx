"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { startJapaneseTranslation, stopJapaneseTranslation } from "@/lib/i18n/autoTranslate";

/**
 * Translates every English UI string on the page into Japanese while the
 * navbar language switch is set to JA, and restores English when set back.
 * See lib/i18n/autoTranslate.ts and lib/i18n/jaDictionary.ts.
 */
export function AutoTranslator() {
  const { language } = useLanguage();

  useEffect(() => {
    if (language === "ja") startJapaneseTranslation();
    else stopJapaneseTranslation();
  }, [language]);

  useEffect(() => () => stopJapaneseTranslation(), []);

  return null;
}
