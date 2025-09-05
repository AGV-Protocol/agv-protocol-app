"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { WalletProvider } from "@/components/wallet/wallet-provider";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false },
    mutations: { retry: 1 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [ThirdwebProvider, setThirdwebProvider] = useState<any>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const loadThirdweb = async () => {
      try {
        const { ThirdwebProvider: Provider } = await import("thirdweb/react");
        const { createThirdwebClient } = await import("thirdweb");
        
        const thirdwebClient = createThirdwebClient({
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
        });
        
        setThirdwebProvider(() => Provider);
        setClient(thirdwebClient);
      } catch (error) {
        console.error("Failed to load Thirdweb:", error);
      }
    };

    loadThirdweb();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {ThirdwebProvider && client ? (
            <ThirdwebProvider client={client}>
              {children}
            </ThirdwebProvider>
          ) : (
            children
          )}
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
