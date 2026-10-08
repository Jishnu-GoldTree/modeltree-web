import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Check, Download, ReceiptText, ShieldCheck } from "lucide-react"

import { Logo } from "@/components/layout/logo"

const PROMISES = [
  { key: "download", Icon: Download },
  { key: "shekels", Icon: ReceiptText },
  { key: "licence", Icon: ShieldCheck },
] as const

/**
 * The brand panel beside the login and sign-up forms.
 *
 * The render is the CAD-to-cast story in one picture, so it gets the top of
 * the panel to itself and the copy sits on a gradient at the foot. Text laid
 * straight over the wireframe was unreadable wherever a line crossed it.
 *
 * Copy speaks to buyers only: every sign-up is a buyer, and seller accounts are
 * granted by GoldTree. The footer row repeats the site-wide promises rather
 * than catalog figures that go stale.
 */
export async function AuthAside({ variant }: { variant: "login" | "signup" }) {
  const t = await getTranslations("authAside")
  const promises = await getTranslations("home.announce")
  const points = [1, 2, 3].map((n) => t(`${variant}${n}`))

  return (
    <aside className="relative hidden flex-col overflow-hidden bg-ink text-white lg:flex">
      {/* unoptimized: the webp is hand-tuned, and re-encoding softens the fine
          wireframe lines. */}
      <Image
        src="/images/auth-cover.webp"
        alt=""
        fill
        unoptimized
        sizes="50vw"
        className="object-cover object-[60%_30%]"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink via-ink/85 via-45% to-ink/10" />

      <div className="relative p-10">
        <Logo />
      </div>

      <div className="relative mt-auto p-10 pt-0">
        <h2 className="max-w-md text-3xl font-semibold tracking-tight text-balance">
          {t(`${variant}Title`)}
        </h2>
        <ul className="mt-6 flex max-w-md flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-white/80">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-on-ink" aria-hidden />
              {point}
            </li>
          ))}
        </ul>

        <ul className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          {PROMISES.map(({ key, Icon }) => (
            <li key={key} className="flex flex-col gap-2 text-xs text-white/65">
              <Icon className="size-4 text-brand-on-ink" aria-hidden />
              {promises(key)}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
