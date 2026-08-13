"use client"

import { useActionState, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { updateProfile, type ProfileState } from "@/lib/actions/profile"
import type { Profile } from "@/lib/data/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Profile settings.
 *
 * Posts straight to a server action rather than going through react-hook-form.
 * Handle uniqueness can only be decided by the database, so the server is the
 * authority either way — validating in two places would mean two rule sets to
 * keep in step.
 */

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      Save changes
    </Button>
  )
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("toast")
  const [state, formAction] = useActionState<ProfileState, FormData>(updateProfile, {})

  // useActionState keeps the same object identity across renders, so key the
  // toast off a counter rather than the value — otherwise saving twice with the
  // same result shows nothing the second time.
  const lastShown = useRef(0)
  useEffect(() => {
    if (state.ok && lastShown.current === 0) {
      lastShown.current = 1
      toast.success(t("profileSaved"))
    }
    if (!state.ok) lastShown.current = 0
    if (state.error) toast.error(t("profileFailed"))
  }, [state, t])

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={profile.fullName ?? ""}
          className="h-10"
          required
        />
        <FieldError message={state.fieldErrors?.fullName} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="handle">Handle</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">modeltree.com/designers/</span>
          <Input
            id="handle"
            name="handle"
            defaultValue={profile.handle}
            className="h-10 flex-1"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Your public storefront address. Changing it breaks existing links.
        </p>
        <FieldError message={state.fieldErrors?.handle} />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">Account type</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {[
            { value: "buyer", label: "Buyer", hint: "Browse and license models" },
            { value: "designer", label: "Designer", hint: "Publish and earn royalties" },
          ].map((option) => (
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
                name="accountType"
                value={option.value}
                defaultChecked={profile.accountType === option.value}
                className="sr-only"
              />
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={profile.location ?? ""}
          placeholder="Tel Aviv, Israel"
          className="h-10"
        />
        <FieldError message={state.fieldErrors?.location} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          placeholder="What you make, and who it's for."
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          Shown on your public storefront. Up to 500 characters.
        </p>
        <FieldError message={state.fieldErrors?.bio} />
      </div>

      <SaveButton />
    </form>
  )
}
