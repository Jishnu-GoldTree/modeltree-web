import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getCurrentUser } from "@/lib/supabase/server"
import { getProfile } from "@/lib/data/profile"
import { getTranslations } from "next-intl/server"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ProfileForm } from "@/components/forms/profile-form"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile/settings">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "profile" })
  return { title: t("settings") }
}

export default async function ProfileSettingsPage() {
  const t = await getTranslations("profile")
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/profile/settings")

  const profile = await getProfile(user.id)
  // The signup trigger creates this row, so a missing profile means something
  // is genuinely wrong rather than a first-visit case.
  if (!profile) redirect("/profile")

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="shell max-w-2xl py-10">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("backToProfile")}
          </Link>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t("settings")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {user.email}. {t("emailManaged")}
          </p>

          <div className="mt-8">
            <ProfileForm profile={profile} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
