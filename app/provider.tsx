"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { WalletProvider } from "@/components/wallet/wallet-provider";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false },
    mutations: { retry: 1 },
  },
});

// Create Thirdweb client
export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider client={thirdwebClient}>
        <WalletProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
          </ThemeProvider>
        </WalletProvider>
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}
