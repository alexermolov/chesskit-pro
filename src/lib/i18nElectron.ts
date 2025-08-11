// Утилиты для работы с i18n в Electron приложении
import { initReactI18next } from "react-i18next";
import i18n, { createInstance } from "i18next";

// Проверяем, работаем ли мы в Electron
export const isElectron = () => {
  return (
    typeof window !== "undefined" &&
    ((window as any).process?.type === "renderer" ||
      (window as any).require ||
      navigator.userAgent.toLowerCase().indexOf("electron") > -1)
  );
};

// Базовый путь для файлов локализации
const getLocalesBasePath = () => {
  if (isElectron()) {
    // В Electron используем относительный путь
    return "./locales";
  }
  // В браузере используем абсолютный путь
  return "/locales";
};

// Функция для загрузки переводов
const loadTranslations = async (locale: string, namespace: string) => {
  const basePath = getLocalesBasePath();
  const url = `${basePath}/${locale}/${namespace}.json`;

  try {
    // В Electron используем fetch с file:// протоколом
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load translations: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();

    // Проверяем, что данные валидны
    if (!data || typeof data !== "object") {
      throw new Error(`Invalid translations data for ${locale}/${namespace}`);
    }

    return data;
  } catch (error) {
    console.warn(
      `Could not load translations for ${locale}/${namespace}:`,
      error
    );

    // Если это английский и общий неймспейс, пытаемся создать минимальные переводы
    if (locale === "en" && namespace === "common") {
      console.warn("Creating fallback translations for en/common");
      return {
        language: "Language",
        loading: "Loading...",
        error: "Error",
        welcome: "Welcome",
        ok: "OK",
        cancel: "Cancel",
      };
    }

    // Для других неймспейсов возвращаем пустой объект
    return {};
  }
};

// Глобальная переменная для хранения экземпляра Electron i18n
let electronI18nInstance: typeof i18n | null = null;

// Инициализация i18n для Electron
export const initElectronI18n = async (locale: string = "en") => {
  if (!isElectron()) {
    // В браузере используем стандартную настройку Next.js
    return null;
  }

  // Создаем отдельный экземпляр i18n для Electron
  const electronI18n = createInstance();
  const namespaces = ["common", "chess", "buttons", "navigation"];
  const resources: Record<string, Record<string, any>> = {};

  // Загружаем все переводы для указанной локали
  for (const namespace of namespaces) {
    try {
      const translations = await loadTranslations(locale, namespace);
      if (!resources[locale]) {
        resources[locale] = {};
      }
      resources[locale][namespace] = translations;
    } catch (error) {
      console.error(`Failed to load ${locale}/${namespace}:`, error);
    }
  }

  // Инициализируем i18n с загруженными ресурсами
  await electronI18n.use(initReactI18next).init({
    lng: locale,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    resources,

    ns: namespaces,
    defaultNS: "common",

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

  // Сохраняем экземпляр для использования в changeLanguageInElectron
  electronI18nInstance = electronI18n;

  return electronI18n;
};

// Функция для смены языка в Electron
export const changeLanguageInElectron = async (locale: string) => {
  if (!isElectron() || !electronI18nInstance) {
    return;
  }

  const namespaces = ["common", "chess", "buttons", "navigation"];

  // Загружаем переводы для новой локали
  for (const namespace of namespaces) {
    try {
      const translations = await loadTranslations(locale, namespace);
      electronI18nInstance.addResourceBundle(
        locale,
        namespace,
        translations,
        true,
        true
      );
    } catch (error) {
      console.error(`Failed to load ${locale}/${namespace}:`, error);
    }
  }

  // Меняем язык
  await electronI18nInstance.changeLanguage(locale);
};
