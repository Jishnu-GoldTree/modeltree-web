"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"

import { signInWithProvider } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

/**
 * The OAuth provider row, shared by login and signup so the two can't drift.
 * Lucide dropped brand icons, so the marks are inlined.
 *
 * Buttons are rendered for every provider the product supports, but only the
 * ones Auth.js actually has credentials for are clickable — `enabledProviders`
 * is resolved on the server and passed down. A configured-looking button that
 * dead-ends is worse than one that says why it's unavailable.
 */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden>
      <circle cx="9" cy="9" r="9" fill="#1877F2" />
      <path
        fill="#fff"
        d="M12.3 11.6 12.7 9H10.2V7.3c0-.71.35-1.4 1.46-1.4h1.14V3.68s-1.03-.18-2.02-.18c-2.06 0-3.4 1.25-3.4 3.5V9H5.1v2.6h2.28v6.29a9.1 9.1 0 0 0 2.82 0V11.6h2.1Z"
      />
    </svg>
  )
}

/** `id` must match the Auth.js provider id. */
const PROVIDERS = [
  { id: "google", name: "Google", Icon: GoogleIcon },
  { id: "facebook", name: "Facebook", Icon: FacebookIcon },
] as const

export function SocialAuthButtons({
  dividerLabel,
  enabledProviders,
  redirectTo = "/",
  onUnavailable,
}: {
  dividerLabel: string
  enabledProviders: string[]
  redirectTo?: string
  onUnavailable: (provider: string) => void
}) {
  const [pending, startTransition] = useTransition()

  // Nothing configured yet — the OAuth apps aren't set up, so a row of
  // dead-ending buttons is worse than none. Once a provider is switched on in
  // Supabase and listed in SUPABASE_OAUTH_PROVIDERS, the buttons return on
  // their own; the divider goes with them so email sign-in isn't left under a
  // stray "or continue with".
  if (enabledProviders.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2 sm:grid-cols-2">
        {PROVIDERS.map(({ id, name, Icon }) => {
          const enabled = enabledProviders.includes(id)
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              className="h-10"
              disabled={pending}
              onClick={() => {
                if (!enabled) return onUnavailable(name)
                startTransition(() => {
                  void signInWithProvider(id, redirectTo)
                })
              }}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Icon />
              )}
              {name}
            </Button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{dividerLabel}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
