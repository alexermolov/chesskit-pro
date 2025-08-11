const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ru", "es", "it", "de", "fr", "nl"],
    localeDetection: false,
  },
  fallbackLng: "en",
  debug: false,

  // Path to translation files
  localePath: path.resolve("./public/locales"),

  // React options
  react: {
    useSuspense: false,
  },

  // Interpolation options
  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // Additional namespaces
  ns: ["common", "chess", "buttons", "navigation"],
  defaultNS: "common",
};
