"use client"

import { SessionProvider } from "next-auth/react"

/**
 * Session context for client components (the header's account menu).
 *
 * No `session` prop on purpose: passing one from the root layout would mean
 * calling `auth()` there, which reads cookies and turns every page dynamic —
 * including the 72 prerendered model pages. Instead the provider fetches the
 * session on mount, so pages stay static and only the header re-renders.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
