import { getTranslations } from "next-intl/server"

import { LegalDocument } from "@/components/legal/legal-document"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "privacy" })
  return { title: t("metaTitle"), description: t("metaDescription") }
}

export default function PrivacyPage() {
  return <LegalDocument namespace="privacy" effectiveDate="2026-08-19" />
}
