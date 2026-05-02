import { createContext, useContext, useMemo, useState } from "react";
import { translations } from "./translations";

const DEFAULT_LANGUAGE = "en";

const LanguageContext = createContext(null);

function getNestedValue(source, path) {
  return path.split(".").reduce((current, key) => current?.[key], source);
}

function replaceParams(text, params = {}) {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    text
  );
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  const value = useMemo(() => {
    const t = (key, params) => {
      const translatedText =
        getNestedValue(translations[language], key) ??
        getNestedValue(translations.en, key) ??
        key;

      return replaceParams(translatedText, params);
    };

    return { language, setLanguage, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}