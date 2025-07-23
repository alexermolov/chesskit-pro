import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { AppProps } from "next/app";
import Layout from "@/sections/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Импорт отладочных утилит PGN в development режиме
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  import("@/lib/pgnDebugUtils")
    .then(() => {
      console.log("🎯 PGN Debug Utils загружены");
    })
    .catch(console.error);
}

const queryClient = new QueryClient();

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </QueryClientProvider>
  );
}
