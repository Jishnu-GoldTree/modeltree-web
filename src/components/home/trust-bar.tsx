import { getTranslations } from "next-intl/server"
import { Download, Ruler } from "lucide-react"

const PROMISES = [
  { key: "dims", Icon: Ruler },
  { key: "download", Icon: Download },
] as const

/**
 * The two things a jeweller checks before buying a file from someone new,
 * answered straight under the hero instead of at the bottom of the page.
 * Each is backed elsewhere: the product page states dimensions, the delivery
 * and licensing pages state the rest.
 */
export async function TrustBar() {
  const t = await getTranslations("home.trust")

  return (
    <div className="border-b bg-background">
      <ul className="shell grid grid-cols-2 items-center gap-x-4 gap-y-4 py-5 sm:items-start sm:gap-6 sm:py-7">
        {PROMISES.map(({ key, Icon }) => (
          <li key={key} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-accent">
              <Icon className="size-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{t(`${key}Title`)}</p>
              <p className="mt-0.5 hidden text-sm text-pretty text-muted-foreground sm:block">
                {t(`${key}Body`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
