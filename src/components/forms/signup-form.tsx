"use client";

import { useState } from "react";
import Link from "next/link";
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
import { SocialAuthButtons } from "@/components/forms/social-auth-buttons";

const ACCOUNT_OPTIONS = [
  {
    value: "buyer",
    label: "I'm buying",
    hint: "Browse and license models",
    Icon: ShoppingBag,
  },
  {
    value: "designer",
    label: "I'm selling",
    hint: "Publish and earn royalties",
    Icon: Upload,
  },
] as const;

export function SignupForm({
  enabledProviders,
}: {
  enabledProviders: string[];
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function onSubmit() {
    setNotice(null);
    // TODO: creating an account by email needs somewhere to put it. Once a
    // database and Auth.js adapter exist: insert the user, hash the password,
    // send a verification email, then land them on their dashboard.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setNotice(
      "Email sign-up needs a user database — not wired yet. Social sign-up is live.",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SocialAuthButtons
        dividerLabel="or sign up with email"
        enabledProviders={enabledProviders}
        onUnavailable={(provider) =>
          setNotice(
            `${provider} sign-up isn't configured yet — its Auth.js credentials are missing.`,
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
                <FormLabel>What brings you here?</FormLabel>
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
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.hint}
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
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="name"
                    placeholder="Omri GoldTree"
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
            render={({ field, fieldState }) => (
              <FormItem className="gap-1.5">
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="h-10 pr-10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                        key={rule.label}
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
                        {rule.label}
                        <span className="sr-only">
                          {met ? "met" : "not met"}
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
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-brand-accent hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-brand-accent hover:underline"
                    >
                      Privacy Policy
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
            disabled={form.formState.isSubmitting}
            className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            Create account
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
