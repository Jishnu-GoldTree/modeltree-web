import { getLocale, getTranslations } from "next-intl/server"
import { ArrowLeft, Check, Info } from "lucide-react"

import { Link, redirect } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { getCurrentUser } from "@/lib/supabase/server"
import { getProfile } from "@/lib/data/profile"
import { getModel } from "@/lib/data/catalog"
import { CHAT_PATH, whatsappChatUrl } from "@/lib/whatsapp"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/whatsapp-icon"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/custom-work/chat">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "custom" })
  return { title: t("chatTitle") }
}

/**
 * The step between "chat with our designers" and WhatsApp itself.
 *
 * It earns its place twice over: the terms of the arrangement — quote first,
 * work second — have to be somewhere a buyer will actually read them, and
 * publishing the team's number to anonymous traffic would turn it into a spam
 * target. Reaching this page at all means an account.
 */
export default async function ChatPage({
  searchParams,
}: PageProps<"/[locale]/custom-work/chat">) {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("custom")

  // A `?model=` slug means the chat was started from a listing ("request
  // changes to this model"); the title then rides along in the greeting.
  const { model: modelSlug } = await searchParams
  const model = typeof modelSlug === "string" ? await getModel(modelSlug) : null
  const returnTo = model
    ? `${CHAT_PATH}?model=${encodeURIComponent(model.slug)}`
    : CHAT_PATH

  const user = await getCurrentUser()
  if (!user) {
    return redirect({
      href: `/signup?next=${encodeURIComponent(returnTo)}`,
      locale,
    })
  }

  // The handle rides along in the message so a phone number arriving cold can
  // be matched to an account. Falling back to the email keeps that true for a
  // profile row that has not been created yet.
  const profile = await getProfile(user.id)
  const url = whatsappChatUrl(
    model ? t("changeGreeting") : t("chatGreeting"),
    profile?.handle ?? user.email ?? user.id,
    model?.title,
  )

  const steps = [1, 2, 3] as const
  const terms = ["chatTerm1", "chatTerm2", "chatTerm3", "chatTerm4"] as const

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <div className="shell max-w-2xl py-10">
          <Link
            href="/custom-work"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("chatBack")}
          </Link>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance">
            {t("chatTitle")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
            {t("chatIntro")}
          </p>

          <h2 className="mt-10 text-lg font-semibold tracking-tight">
            {t("chatStepsTitle")}
          </h2>
          <ol className="mt-4 flex flex-col gap-4">
            {steps.map((n) => (
              <li key={n} className="flex gap-3.5 rounded-xl border p-4">
                <span
                  aria-hidden
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/40 font-mono text-sm text-muted-foreground"
                >
                  {n}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{t(`chatStep${n}Title`)}</p>
                  <p className="mt-1 text-sm text-pretty text-muted-foreground">
                    {t(`chatStep${n}Body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <h2 className="mt-10 text-lg font-semibold tracking-tight">
            {t("chatTermsTitle")}
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 rounded-xl border bg-muted/40 p-5">
            {terms.map((term) => (
              <li key={term} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden />
                <span className="text-pretty text-muted-foreground">{t(term)}</span>
              </li>
            ))}
          </ul>

          {url ? (
            <div className="mt-8">
              <Button
                asChild
                className="h-12 w-full bg-brand px-6 text-base text-brand-foreground hover:bg-brand/85"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="size-5" />
                  {t("chatOpen")}
                  <span className="sr-only"> ({t("chatNewTab")})</span>
                </a>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {t("chatHours")}
              </p>
            </div>
          ) : (
            /* No number configured. Saying so and pointing at the request
               queue beats a wa.me link with no recipient, which looks broken
               rather than unfinished. */
            <p className="mt-8 flex items-start gap-2.5 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("chatUnavailable")}
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
