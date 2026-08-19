"use client"

import { useSyncExternalStore } from "react"

/**
 * False on the server and for the first client render (hydration), true after.
 *
 * Gate anything whose value is known only on the client — auth, cookies — on
 * this hook. useSyncExternalStore hands React a distinct server snapshot
 * (`false`), so the first client render always matches the server HTML and only
 * flips once hydration has committed; reading the client-only value after that
 * can't cause a hydration mismatch. Later client-side mounts read `true`
 * straight away, so navigating between pages costs no placeholder flash.
 */
const subscribeNoop = () => () => {}

export function useHasHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
}
