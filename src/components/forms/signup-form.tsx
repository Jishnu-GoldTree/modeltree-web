"use client";

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Eye,
  EyeOff,
  Info,
  Loader2,
  ShoppingBag,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  PASSWORD_RULES,
  signupSchema,
  type SignupValues,
} from "@/lib/validations/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SocialAuthButtons } from "@/components/forms/social-auth-buttons"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "@/i18n/navigation";

const ACCOUNT_OPTIONS = [
  { value: "buyer", labelKey: "buying", hintKey: "buyingHint", Icon: ShoppingBag },
  { value: "designer", labelKey: "selling", hintKey: "sellingHint", Icon: Upload },
] as const;

export function SignupForm({
  enabledProviders,
}: {
  enabledProviders: string[];
}) {
  const t = useTranslations("auth");
  const feedback = useTranslations("toast");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Navigating is a separate pending state from submitting: react-hook-form
  // clears isSubmitting the moment onSubmit returns, but the push to /profile
  // is still fetching. Without this the button stops spinning and the page sits
  // there looking broken for as long as the destination takes to render.
  const [isNavigating, startNavigation] = useTransition();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    // onChange so the password checklist ticks as you type rather than only
    // after a failed submit.
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      accountType: "buyer",
      terms: false,
    },
  });

  // useWatch, not form.watch: watch() returns a fresh function each render,
  // which makes React Compiler bail out of memoizing this whole component.
  const password = useWatch({ control: form.control, name: "password" });

  async function onSubmit(values: SignupValues) {
    setNotice(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Lands on auth.users.raw_user_meta_data; a trigger copies it into the
        // profiles table so the app never reads the auth schema directly.
        data: { full_name: values.name, account_type: values.accountType },
      },
    });

    if (error) {
      const taken = error.message.toLowerCase().includes("already");
      toast.error(feedback(taken ? "emailTaken" : "signUpFailed"));
      setNotice(
        taken
          ? "That email already has an account. Try logging in instead."
          : "Could not create the account. Check the details and try again.",
      );
      return;
    }

    // With email confirmation enabled, signUp returns a user but no session.
    // The toast is the headline; the inline notice stays because it names the
    // address and has to still be on screen after the toast times out.
    if (!data.session) {
      toast.info(feedback("confirmEmail"));
      setNotice(
        `Check ${values.email} for a confirmation link to finish setting up your account.`,
      );
      return;
    }

    // Fires before the navigation, so there is feedback the instant the account
    // exists rather than only once /profile has rendered.
    toast.success(feedback("accountCreated"));

    startNavigation(() => {
      router.push("/profile");
      // Re-render server components so they see the new session cookie.
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <SocialAuthButtons
        dividerLabel={t("orSignUpEmail")}
        enabledProviders={enabledProviders}
        onUnavailable={(provider) =>
          setNotice(
            `${provider} sign-up isn't enabled yet. Turn it on in the Supabase dashboard under Authentication → Providers.`,
          )
        }
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel>{t("accountType")}</FormLabel>
                <FormControl>
                  <div role="radiogroup" className="grid grid-cols-2 gap-2">
                    {ACCOUNT_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors",
                          "hover:bg-accent has-checked:border-brand has-checked:bg-brand-muted",
                          "has-focus-visible:ring-3 has-focus-visible:ring-brand/50",
                        )}
                      >
                        <input
                          type="radio"
                          name={field.name}
                          value={option.value}
                          checked={field.value === option.value}
                          onChange={() => field.onChange(option.value)}
                          onBlur={field.onBlur}
                          className="sr-only"
                        />
                        <option.Icon
                          className="size-4 text-brand-accent"
                          aria-hidden
                        />
                        <span className="text-sm font-medium">
                          {t(option.labelKey)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t(option.hintKey)}
                        </span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="name"
                    placeholder="Dana Levi"
                    className="h-10"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem className="gap-1.5">
                <FormLabel>{t("password")}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="h-10 pe-10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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

                {/* The checklist replaces the error message: showing both says
                    the same thing twice, in two different colours. Unmet rules
                    go red only once the field has actually errored, so the list
                    reads as guidance while typing and as the failure after a
                    rejected submit. */}
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
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
                    );
                  })}
                </ul>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="gap-1.5">
                <div className="flex items-start gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="terms"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="mt-0.5 size-4 rounded border-input accent-brand"
                    />
                  </FormControl>
                  <Label
                    htmlFor="terms"
                    className="text-sm leading-snug font-normal"
                  >
                    {t("agree")}{" "}
                    <Link
                      href="/terms"
                      className="text-brand-accent hover:underline"
                    >
                      {t("terms")}
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-brand-accent hover:underline"
                    >
                      {t("privacy")}
                    </Link>
                  </Label>
                </div>
                <FormMessage className="text-xs" />
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
            {t("createAccount")}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
