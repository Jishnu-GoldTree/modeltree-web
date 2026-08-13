import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getCurrentUser } from "@/lib/supabase/server"
import { getProfile } from "@/lib/data/profile"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ProfileForm } from "@/components/forms/profile-form"

export const metadata = { title: "Profile settings" }

export default async function ProfileSettingsPage() {
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
            Back to profile
          </Link>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Profile settings</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {user.email}. Your email is managed by your sign-in method and
            can&apos;t be changed here.
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
