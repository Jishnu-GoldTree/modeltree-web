"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, MailCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Link } from "@/i18n/navigation"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/forms"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function ForgotPasswordForm() {
  const t = useTranslations("auth")
  const feedback = useTranslations("toast")
  const locale = useLocale()
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    const supabase = createClient()

    // The recovery link returns through the shared OAuth callback, which
    // exchanges the code for a session and forwards to /reset-password. The
    // locale rides along so an English visitor isn't dropped on the Hebrew page.
    const next = locale === "en" ? "/en/reset-password" : "/reset-password"
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    })

    // Supabase returns success whether or not the address has an account, so the
    // form can't be used to probe which emails are registered. A real error is a
    // transport or rate-limit failure, not "no such user" — so the confirmation
    // is shown either way, and only a genuine send failure interrupts it.
    if (error) {
      toast.error(feedback("resetFailed"))
      return
    }

    toast.success(feedback("resetLinkSent"))
    setSentTo(values.email)
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground"
        >
          <MailCheck
            className="mt-px size-4 shrink-0 text-brand-accent"
            aria-hidden
          />
          {t("forgotSent", { email: sentTo })}
        </p>
        <Button asChild variant="outline" className="h-10">
          <Link href="/login">{t("backToLogin")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="you@studio.com"
                    className="h-10"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            {t("sendResetLink")}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {t("rememberedPassword")}{" "}
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  )
}
