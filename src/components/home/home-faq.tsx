import { getTranslations } from "next-intl/server"
import { Plus } from "lucide-react"

import { Link } from "@/i18n/navigation"

type FaqItem = { q: string; a: string }

/**
 * The questions that otherwise arrive on WhatsApp before a first purchase.
 *
 * Native <details>, not the Radix accordion: closed answers stay in the HTML,
 * so they are readable without JavaScript and indexable, and the FAQPage
 * JSON-LD below repeats them for rich results. Every answer is a summary of a
 * policy page (licensing, delivery, refunds) and must stay in step with it.
 */
export async function HomeFaq() {
  const t = await getTranslations("home.faq")
  const items = t.raw("items") as FaqItem[]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <section id="faq" className="shell scroll-mt-28">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {t("title")}
        </h2>

        <div className="mt-8 divide-y rounded-2xl border bg-card">
          {items.map((item) => (
            <details key={item.q} className="group px-5 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start text-base font-medium sm:text-lg [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-foreground transition-colors group-open:border-brand group-open:bg-brand group-open:text-brand-foreground">
                  <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" aria-hidden />
                </span>
              </summary>
              <p className="pb-6 text-base text-pretty text-muted-foreground sm:pe-12">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.rich("more", {
            link: (chunks) => (
              <Link href="/contact" className="font-medium text-brand-accent hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>

      <script
        type="application/ld+json"
        // Static, server-rendered copy from our own message catalog; `<` is
        // escaped so no answer text can close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  )
}
