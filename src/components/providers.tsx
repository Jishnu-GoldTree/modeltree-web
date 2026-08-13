"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * Client-side query cache.
 *
 * Most data in this app never reaches TanStack Query: catalog reads, the cart,
 * favourites and auth all resolve in server components and server actions,
 * which is what keeps pages prerenderable and lets RLS authorise on the server.
 * This covers the genuinely client-side cases — values that change without a
 * navigation, or that need polling.
 *
 * The client is created inside useState rather than at module scope: a module
 * singleton is shared across requests on the server, so one user's cache could
 * be served to another.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Server-rendered pages are already fresh on arrival; refetching
            // immediately on mount would just duplicate work.
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
