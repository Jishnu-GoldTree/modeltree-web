"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Info, Loader2 } from "lucide-react"

import { loginSchema, type LoginValues } from "@/lib/validations/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { SocialAuthButtons } from "@/components/forms/social-auth-buttons"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

export function LoginForm({
  enabledProviders,
  authError,
  demoEnabled,
  redirectTo,
}: {
  enabledProviders: string[]
  authError?: string
  demoEnabled: boolean
  redirectTo: string
}) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<string | null>(authError ?? null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  })

  async function onSubmit(values: LoginValues) {
    setNotice(null)

    // Signed in from the client, not through a server action. A server-side
    // `signIn` redirects via a soft navigation, which never remounts
    // SessionProvider — the session cookie is set but the header keeps showing
    // "Log in" until a hard reload. The client helper updates the session in
    // place. OAuth can stay server-side because it leaves the site entirely and
    // comes back on a fresh document.
    const result = await signIn("demo", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    // One message for every failure: distinguishing "no such account" from
    // "wrong password" turns the form into an account-existence oracle.
    if (!result || result.error) {
      setNotice("That email and password don't match an account.")
      return
    }

    router.push(redirectTo)
    router.refresh()
  }


  return (
    <div className="flex flex-col gap-6">
      <SocialAuthButtons
        dividerLabel="or continue with email"
        enabledProviders={enabledProviders}
        onUnavailable={(provider) =>
          setNotice(
            `${provider} sign-in isn't configured yet — its Auth.js credentials are missing.`,
          )
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel>Email</FormLabel>
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-brand-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-10 pr-10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  {/* No checkbox primitive in this project yet; a native input
                      keeps the a11y semantics without pulling in a dependency. */}
                  <input
                    type="checkbox"
                    id="remember"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="size-4 rounded border-input accent-brand"
                  />
                </FormControl>
                <Label htmlFor="remember" className="text-sm font-normal">
                  Keep me signed in for 30 days
                </Label>
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
            disabled={form.formState.isSubmitting}
            className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            Log in
          </Button>
        </form>
      </Form>

      {demoEnabled && (
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo accounts</p>
          <p className="mt-1">
            Buyer <code className="font-mono">omri@goldtree.com</code> · Designer{" "}
            <code className="font-mono">designer@modeltree.demo</code>
            <br />
            Password <code className="font-mono">demo1234</code>
          </p>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        New to MODELTREE?{" "}
        <Link href="/signup" className="font-medium text-brand-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
