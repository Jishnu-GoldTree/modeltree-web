import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/supabase/server"
import { getCategoryOptions, getLicenseOptionsForForm } from "@/lib/data/designer"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ListingForm } from "@/components/forms/listing-form"

export const metadata = { title: "New listing" }

export default async function UploadPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/dashboard/upload")

  const [categories, licenses] = await Promise.all([
    getCategoryOptions(),
    getLicenseOptionsForForm(),
  ])

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="shell max-w-3xl py-10">
          <h1 className="text-2xl font-semibold tracking-tight">New listing</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Describe the model and set a price. You can save a draft and come
            back. Nothing is visible to buyers until you publish.
          </p>

          <div className="mt-8">
            <ListingForm categories={categories} licenses={licenses} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
