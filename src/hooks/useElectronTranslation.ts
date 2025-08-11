// Хук для использования i18n в Electron окружении
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { isElectron, changeLanguageInElectron } from "@/lib/i18nElectron";
import i18n from "i18next";

export const useElectronTranslation = (namespace: string = "common") => {
  const translation = useTranslation(namespace);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState(translation.i18n.language);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Функция для смены языка с обработкой ошибок
  const changeLanguage = async (locale: string) => {
    if (!isElectron()) {
      // В браузере используем стандартный метод Next.js
      return translation.i18n.changeLanguage(locale);
    }

    setIsLoading(true);
    setError(null);

    try {
      await changeLanguageInElectron(locale);
      localStorage.setItem("i18nextLng", locale);

      // Обновляем локальное состояние
      setCurrentLang(locale);

      // Принудительно обновляем компонент
      setForceUpdate((prev) => prev + 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to change language";
      setError(errorMessage);
      console.error("Error changing language in Electron:", err);
    } finally {
      setIsLoading(false);
    }

    return true;
  };

  // Следим за изменениями языка в i18n (для Electron)
  useEffect(() => {
    if (isElectron()) {
      const handleLanguageChanged = (lng: string) => {
        setCurrentLang(lng);
        setForceUpdate((prev) => prev + 1);
      };

      // eslint-disable-next-line import/no-named-as-default-member
      i18n.on("languageChanged", handleLanguageChanged);

      return () => {
        // eslint-disable-next-line import/no-named-as-default-member
        i18n.off("languageChanged", handleLanguageChanged);
      };
    }

    return undefined;
  }, []);

  // Проверяем доступность переводов при монтировании компонента
  useEffect(() => {
    if (isElectron()) {
      // В Electron проверяем глобальный i18n
      // eslint-disable-next-line import/no-named-as-default-member
      const hasTranslations = i18n.hasResourceBundle(currentLang, namespace);

      if (!hasTranslations && currentLang !== "en") {
        setError(`Translations not loaded for ${currentLang}/${namespace}`);
        console.warn(
          `Missing translations for ${currentLang}/${namespace}, falling back to English`
        );
      } else {
        setError(null); // Очищаем ошибку если переводы есть
      }
    } else if (translation.ready) {
      // В браузере проверяем Next.js i18n
      const hasTranslations = translation.i18n.hasResourceBundle(
        translation.i18n.language,
        namespace
      );

      if (!hasTranslations) {
        setError(
          `Translations not loaded for ${translation.i18n.language}/${namespace}`
        );
      } else {
        setError(null);
      }
    }
  }, [
    translation.ready,
    currentLang,
    namespace,
    translation.i18n,
    forceUpdate,
  ]);

  // Создаем кастомную функцию t для Electron
  const t = (key: string, options?: any) => {
    if (isElectron()) {
      try {
        // В Electron используем глобальный i18n
        // eslint-disable-next-line import/no-named-as-default-member
        const result = i18n.t(key, { ...options, ns: namespace });

        // Если перевод не найден, возвращаем ключ
        if (result === key && currentLang !== "en") {
          // Пытаемся получить английский перевод как fallback
          // eslint-disable-next-line import/no-named-as-default-member
          return i18n.t(key, { ...options, ns: namespace, lng: "en" });
        }

        return result;
      } catch (error) {
        console.error(`Translation error for key "${key}":`, error);
        return key;
      }
    }
    // В браузере используем стандартный translation
    return translation.t(key, options);
  };

  return {
    ...translation,
    t,
    i18n: isElectron() ? { ...i18n, language: currentLang } : translation.i18n,
    changeLanguage,
    isLoading,
    error,
    isElectron: isElectron(),
    ready: translation.ready,
  };
};

export default useElectronTranslation;
