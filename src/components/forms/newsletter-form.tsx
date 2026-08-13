"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2 } from "lucide-react"

import { newsletterSchema, type NewsletterValues } from "@/lib/validations/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

export function NewsletterForm() {
  const feedback = useTranslations("toast")
  const t = useTranslations("footer")
  const [done, setDone] = useState(false)
  const form = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit() {
    // TODO: POST the validated email to the subscriptions endpoint once it exists.
    await new Promise((resolve) => setTimeout(resolve, 600))
    toast.success(feedback("subscribed"))
    setDone(true)
    form.reset()
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-brand">
        <Check className="size-4" aria-hidden />
        {t("subscribed")}
      </p>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2 sm:max-w-sm"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    aria-label={t("emailLabel")}
                    placeholder="you@studio.com"
                    className="h-10 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  />
                </FormControl>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="h-10 shrink-0 bg-brand text-brand-foreground hover:bg-brand/85"
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}
                  {t("subscribe")}
                </Button>
              </div>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
