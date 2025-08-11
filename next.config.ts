import { withSentryConfig } from "@sentry/nextjs";
import { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  // Загружаем i18n только для development
  const config: NextConfig = {
    output: phase === PHASE_PRODUCTION_BUILD ? "export" : undefined,
    trailingSlash: true,
    reactStrictMode: true,
    distDir: "out",
    images: {
      unoptimized: true,
    },
    async rewrites() {
      return [
        // Redirect static assets (pieces, engines, sounds, icons, locales) to remove locale prefix
        {
          source: "/:locale(en|ru|es|it|de|fr|nl)/piece/:path*",
          destination: "/piece/:path*",
        },
        {
          source: "/:locale(en|ru|es|it|de|fr|nl)/engines/:path*",
          destination: "/engines/:path*",
        },
        {
          source: "/:locale(en|ru|es|it|de|fr|nl)/sounds/:path*",
          destination: "/sounds/:path*",
        },
        {
          source: "/:locale(en|ru|es|it|de|fr|nl)/icons/:path*",
          destination: "/icons/:path*",
        },
        {
          source: "/:locale(en|ru|es|it|de|fr|nl)/locales/:path*",
          destination: "/locales/:path*",
        },
      ];
    },
    headers:
      phase === PHASE_PRODUCTION_BUILD
        ? undefined
        : async () => [
            {
              source: "/",
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
              ],
            },
            {
              source: "/engines/:blob*",
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
                {
                  key: "Age",
                  value: "181921",
                },
              ],
            },
            // Add headers for localized paths
            {
              source: "/:locale(en|ru|es|it|de|fr|nl)/engines/:blob*",
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
                {
                  key: "Age",
                  value: "181921",
                },
              ],
            },
            {
              source: "/play",
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
              ],
            },
            {
              source: "/:locale(en|ru|es|it|de|fr|nl)/play",
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
              ],
            },
            {
              source: "/database",
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
              ],
            },
            {
              source: "/:locale(en|ru|es|it|de|fr|nl)/database",
              headers: [
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "require-corp",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
              ],
            },
          ],
  };

  // Добавляем i18n только для development
  if (phase !== PHASE_PRODUCTION_BUILD) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { i18n } = require("./next-i18next.config.js");
    config.i18n = i18n;
  }

  return config;
};

export default withSentryConfig(nextConfig, {
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  org: process.env.SENTRY_ORG,
  project: "javascript-nextjs",
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  hideSourceMaps: true,
  disableLogger: true,
});
