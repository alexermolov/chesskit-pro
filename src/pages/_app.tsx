import Layout from "@/sections/layout";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { ElectronI18nProvider } from "@/providers/ElectronI18nProvider";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ElectronI18nProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ElectronI18nProvider>
    </QueryClientProvider>
  );
}

export default appWithTranslation(MyApp);
