import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Gem, Ruler, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Thumb } from "@/components/marketplace/thumb"

/**
 * The jewellery library — GoldTree's actual differentiator.
 *
 * Every figure here is real and checkable: 40,000 models, 4 designers, 2 years.
 * That matters because the rest of this page's numbers were invented placeholder
 * and had to be pulled; these are claims the client can stand behind.
 *
 * The catalog count in the hero is a live query and currently far below 40,000 —
 * the library exists but has not been imported yet. This section describes the
 * library rather than the loaded catalog, so the two do not contradict.
 */
export async function JewelleryLibrary() {
  const t = await getTranslations("jewellery")

  const facts = [
    { Icon: Gem, key: "cast" },
    { Icon: Ruler, key: "sizes" },
    { Icon: Sparkles, key: "inhouse" },
  ] as const

  return (
    <section className="section-band border-y bg-ink text-ink-foreground">
      <div className="shell grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand">
            <Gem className="size-3.5" aria-hidden />
            {t("badge")}
          </span>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            {t("body")}
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
            {[
              { value: "40,000", key: "models" },
              { value: "4", key: "designers" },
              { value: "2", key: "years" },
            ].map((stat) => (
              <div key={stat.key}>
                <dt className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs text-white/55">{t(stat.key)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-11 bg-brand px-6 text-brand-foreground hover:bg-brand/85">
              <Link href="/3d-models/jewelry">{t("browse")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/custom-work">{t("commission")}</Link>
            </Button>
          </div>
        </div>

        <div>
          <ul className="grid grid-cols-2 gap-3">
            {["ring", "pendant", "setting", "band"].map((piece) => (
              <li key={piece}>
                <Thumb
                  seed={`jewellery-${piece}`}
                  className="aspect-4/3 rounded-xl border border-white/10"
                />
              </li>
            ))}
          </ul>

          <ul className="mt-6 flex flex-col gap-3">
            {facts.map(({ Icon, key }) => (
              <li key={key} className="flex items-start gap-2.5 text-sm text-white/75">
                <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
