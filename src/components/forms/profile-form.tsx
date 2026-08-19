"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Check, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { updateProfile, type ProfileState } from "@/lib/actions/profile"
import type { HandleStatus } from "@/app/api/handle/route"
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

function SaveButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {label}
    </Button>
  )
}

/**
 * Debounced availability lookup against /api/handle. The database is still the
 * authority — this only tells the user before they submit. Own handle and any
 * value too short to be valid short-circuit to "idle" so we don't flag someone
 * for keeping their own name or mid-type.
 *
 * The shown status is derived during render, and the fetched result is stored
 * against the handle it was for; the effect only sets state after the network
 * settles, never synchronously. A result that no longer matches the current
 * input reads as "checking" until the debounced fetch catches up.
 */
function useHandleStatus(value: string, current: string): "idle" | "checking" | HandleStatus {
  const handle = value.trim().toLowerCase()
  const checkable = handle.length >= 3 && handle !== current.trim().toLowerCase()
  const [result, setResult] = useState<{ handle: string; status: HandleStatus } | null>(null)

  useEffect(() => {
    if (!checkable) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/handle?value=${encodeURIComponent(handle)}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as { status: HandleStatus }
        setResult({ handle, status: data.status })
      } catch {
        // Aborted (value changed) or offline — the server save stays the backstop.
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [handle, checkable])

  if (!checkable) return "idle"
  return result?.handle === handle ? result.status : "checking"
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("toast")
  const f = useTranslations("profileForm")
  const [state, formAction] = useActionState<ProfileState, FormData>(updateProfile, {})
  const [handle, setHandle] = useState(profile.handle)
  const handleStatus = useHandleStatus(handle, profile.handle)

  // Only failures are reported here. A successful save redirects to /profile and
  // its toast travels in `?flash=`, since this form unmounts on the way.
  useEffect(() => {
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
        <Label htmlFor="fullName">{f("name")}</Label>
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
        <Label htmlFor="handle">{f("handle")}</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{f("handlePrefix")}</span>
          <Input
            id="handle"
            name="handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            aria-describedby="handle-status"
            autoComplete="off"
            spellCheck={false}
            className="h-10 flex-1"
            required
          />
        </div>
        <p id="handle-status" aria-live="polite" className="min-h-4 text-xs">
          {handleStatus === "checking" && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Loader2 className="size-3 animate-spin" aria-hidden />
              {f("handleChecking")}
            </span>
          )}
          {handleStatus === "available" && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="size-3" aria-hidden />
              {f("handleAvailable")}
            </span>
          )}
          {handleStatus === "taken" && (
            <span className="inline-flex items-center gap-1 text-destructive">
              <X className="size-3" aria-hidden />
              {f("handleTaken")}
            </span>
          )}
          {handleStatus === "invalid" && (
            <span className="text-muted-foreground">{f("handleInvalid")}</span>
          )}
          {(handleStatus === "idle" || handleStatus === "self") && (
            <span className="text-muted-foreground">{f("handleHint")}</span>
          )}
        </p>
        <FieldError message={state.fieldErrors?.handle} />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{f("accountType")}</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {[
            { value: "buyer", label: f("buyer"), hint: f("buyerHint") },
            { value: "designer", label: f("designer"), hint: f("designerHint") },
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
        <Label htmlFor="location">{f("location")}</Label>
        <Input
          id="location"
          name="location"
          defaultValue={profile.location ?? ""}
          placeholder={f("locationPlaceholder")}
          className="h-10"
        />
        <FieldError message={state.fieldErrors?.location} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">{f("bio")}</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          placeholder={f("bioPlaceholder")}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          {f("bioHint")}
        </p>
        <FieldError message={state.fieldErrors?.bio} />
      </div>

      <SaveButton label={f("save")} disabled={handleStatus === "taken"} />
    </form>
  )
}
