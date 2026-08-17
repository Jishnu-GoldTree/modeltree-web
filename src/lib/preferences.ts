"use client"

import { useSyncExternalStore } from "react"

import { routing, type Locale } from "@/i18n/routing"
import { COUNTRY_COOKIE, ISRAEL } from "@/lib/geo"

/**
 * Visitor preferences that live in the browser.
 *
 * Cookies rather than localStorage: both values are things the server may want
 * to read later — a stored locale is exactly what a future server-side
 * redirect would need — and a cookie set here is visible to it without a
 * round trip through client state.
 *
 * A year, because both are answers to "do not ask me again". Lax so they
 * survive a normal top-level navigation from a shared link.
 */
const YEAR = 60 * 60 * 24 * 365

/**
 * Our own cookie, not NEXT_LOCALE. next-intl writes NEXT_LOCALE on its own
 * responses, so reading it to mean "the visitor chose a language" was always
 * true and the prompt never appeared. This one is only ever written when
 * somebody actually answers.
 */
export const LOCALE_COOKIE = "mt_locale_choice"
export const COOKIE_NOTICE_COOKIE = "mt_cookie_notice"

function read(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function write(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${YEAR}; samesite=lax`
}

/** The locale the visitor explicitly picked, if they ever have. */
export function readLocalePreference(): Locale | null {
  const value = read(LOCALE_COOKIE)
  return routing.locales.includes(value as Locale) ? (value as Locale) : null
}

export function writeLocalePreference(locale: Locale) {
  write(LOCALE_COOKIE, locale)
  // Mirrored into NEXT_LOCALE so next-intl and any future server-side routing
  // see the same answer.
  write("NEXT_LOCALE", locale)
  emit()
}

/**
 * Written by the proxy from Vercel's edge, never by us — so it is a fact about
 * the visitor, not an answer they gave. Kept separate from the locale cookie
 * for that reason: LOCALE_COOKIE means somebody chose.
 */
export function isIsraeliVisitor() {
  return read(COUNTRY_COOKIE) === ISRAEL
}

export function hasSeenCookieNotice() {
  return read(COOKIE_NOTICE_COOKIE) === "1"
}

export function acknowledgeCookieNotice() {
  write(COOKIE_NOTICE_COOKIE, "1")
  emit()
}

/* ─────────────────────────── reading them in React ─────────────────────── */

/**
 * Preferences are an external store, so components read them with
 * useSyncExternalStore rather than an effect that calls setState on mount.
 * Cookies are unreadable during SSR, so the server snapshot reports "not
 * ready" and prompts render nothing until the client takes over — no
 * hydration mismatch, and no flash of a prompt someone already answered.
 */
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** A primitive snapshot: useSyncExternalStore requires a stable identity. */
function clientSnapshot() {
  return `${readLocalePreference() ?? ""}|${hasSeenCookieNotice() ? "1" : "0"}`
}

const SERVER_SNAPSHOT = "server"

export type VisitorPrefs = {
  ready: boolean
  locale: Locale | null
  cookieNoticeSeen: boolean
}

export function useVisitorPrefs(): VisitorPrefs {
  const snapshot = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    () => SERVER_SNAPSHOT,
  )

  if (snapshot === SERVER_SNAPSHOT) {
    return { ready: false, locale: null, cookieNoticeSeen: true }
  }

  const [locale, seen] = snapshot.split("|")
  return {
    ready: true,
    locale: (locale || null) as Locale | null,
    cookieNoticeSeen: seen === "1",
  }
}
