"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, Eye, EyeOff, Info, Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from "@/lib/utils"
import { Link, useRouter } from "@/i18n/navigation"
import {
  PASSWORD_RULES,
  resetPasswordSchema,
  type ResetPasswordValues,
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
} from "@/components/ui/form"

export function ResetPasswordForm() {
  const t = useTranslations("auth")
  const feedback = useTranslations("toast")
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  // Same split as the other auth forms: isSubmitting clears when onSubmit
  // returns, but the redirect home is still loading. This keeps the button busy
  // until it lands.
  const [isNavigating, startNavigation] = useTransition()

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "" },
  })

  // useWatch, not form.watch: watch() returns a fresh function each render,
  // which makes React Compiler bail out of memoizing this component.
  const password = useWatch({ control: form.control, name: "password" })

  async function onSubmit(values: ResetPasswordValues) {
    setNotice(null)

    // The recovery session was established by the callback before this page
    // loaded, so updateUser writes against it. No current password is asked
    // for — arriving here at all means the emailed link was valid.
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      // The one failure worth naming: a missing session means the link expired
      // or was already spent, and the fix is to request a fresh one.
      const expired = error.message.toLowerCase().includes("session")
      toast.error(feedback("passwordUpdateFailed"))
      setNotice(expired ? t("resetExpired") : t("resetError"))
      return
    }

    // updateUser leaves the recovery session in place, so they land signed in.
    toast.success(feedback("passwordUpdated"))

    startNavigation(() => {
      router.push("/")
      // Re-render server components so they see the session cookie.
      router.refresh()
    })
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
            name="password"
            render={({ field, fieldState }) => (
              <FormItem className="gap-1.5">
                <FormLabel>{t("newPassword")}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={t("ruleLength")}
                      className="h-10 pe-10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t("hidePassword") : t("showPassword")
                    }
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 end-0 inline-flex w-10 items-center justify-center rounded-e-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>

                {/* The checklist stands in for the error message, exactly as on
                    signup: unmet rules turn red only after a rejected submit, so
                    the list reads as guidance while typing. */}
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password)
                    return (
                      <li
                        key={rule.key}
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          met
                            ? "text-brand-accent"
                            : fieldState.error
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        <Check
                          className={cn("size-3.5", !met && "opacity-40")}
                          aria-hidden
                        />
                        {t(rule.key)}
                        <span className="sr-only">
                          {met ? t("ruleMet") : t("ruleNotMet")}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </FormItem>
            )}
          />

          {notice && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground"
            >
              <Info className="mt-px size-4 shrink-0" aria-hidden />
              {notice}
            </p>
          )}

          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isNavigating}
            className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
          >
            {(form.formState.isSubmitting || isNavigating) && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            {t("updatePassword")}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="font-medium text-brand-accent hover:underline"
        >
          {t("forgot")}
        </Link>
      </p>
    </div>
  )
}
