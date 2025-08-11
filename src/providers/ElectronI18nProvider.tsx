// i18n provider for Electron environment
import { initElectronI18n, isElectron } from "@/lib/i18nElectron";
import i18n, { createInstance } from "i18next";
import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

interface ElectronI18nProviderProps {
  children: React.ReactNode;
}

export const ElectronI18nProvider: React.FC<ElectronI18nProviderProps> = ({
  children,
}) => {
  const [isElectronI18nReady, setIsElectronI18nReady] = useState(false);
  const [electronI18n, setElectronI18n] = useState<typeof i18n | null>(null);
  const [isElectronEnv, setIsElectronEnv] = useState(false);

  useEffect(() => {
    // Check for Electron only on the client side
    const electronCheck = isElectron();
    setIsElectronEnv(electronCheck);

    if (electronCheck) {
      console.log("Initializing Electron i18n...");
      const locale = localStorage.getItem("i18nextLng") || "en";

      initElectronI18n(locale)
        .then((i18nInstance) => {
          if (i18nInstance) {
            console.log("Electron i18n provider initialized successfully");
            setElectronI18n(i18nInstance);
            setIsElectronI18nReady(true);
          } else {
            throw new Error("Failed to initialize i18n instance");
          }
        })
        .catch((error) => {
          console.error("Failed to initialize Electron i18n provider:", error);
          // In case of error, create a minimal i18n instance
          const fallbackI18n = createInstance();
          fallbackI18n
            .init({
              lng: locale,
              fallbackLng: "en",
              resources: {
                en: {
                  common: {
                    loading: "Loading...",
                    error: "Error",
                    language: "Language",
                  },
                },
              },
              interpolation: {
                escapeValue: false,
              },
              react: {
                useSuspense: false,
              },
            })
            .then(() => {
              setElectronI18n(fallbackI18n);
              setIsElectronI18nReady(true);
            })
            .catch(() => {
              // Last resort - allow loading without i18n
              setIsElectronI18nReady(true);
            });
        });
    } else {
      setIsElectronI18nReady(true);
    }
  }, []);

  // In Electron, use I18nextProvider with our i18n instance
  if (isElectronEnv) {
    if (!isElectronI18nReady) {
      return <div style={{ padding: "20px" }}>Loading translations...</div>;
    }

    if (electronI18n) {
      return <I18nextProvider i18n={electronI18n}>{children}</I18nextProvider>;
    }

    // If there is no i18n instance, render children as is
    return <>{children}</>;
  }

  // In the browser, return children as is (next-i18next will work at a higher level)
  return <>{children}</>;
};

export default ElectronI18nProvider;
