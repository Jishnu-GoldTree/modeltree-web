"use client"

import { useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { searchSchema, type SearchValues } from "@/lib/validations/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

type SearchFormProps = {
  placeholder?: string
  /** `hero` is the large landing search; `compact` sits in the sticky header. */
  size?: "hero" | "compact"
  className?: string
  autoFocus?: boolean
}

export function SearchForm({
  placeholder,
  size = "hero",
  className,
  autoFocus,
}: SearchFormProps) {
  const router = useRouter()
  const t = useTranslations("nav")
  const label = placeholder ?? t("search")
  const form = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { q: "" },
    mode: "onSubmit",
  })

  // No toast for search — the results page is the confirmation. What it does
  // need is a busy state, since the catalog reads the database and cannot be
  // prefetched, so the click otherwise looks like it did nothing.
  const [isSearching, startSearch] = useTransition()

  // Straight to the catalog: `q` is one of its filters, so a search lands on a
  // page where the term can be narrowed by metal, stone or format rather than
  // on a dead end that only knows how to match a title.
  function onSubmit(values: SearchValues) {
    startSearch(() => {
      router.push(`/3d-models?q=${encodeURIComponent(values.q)}`)
    })
  }

  const isHero = size === "hero"

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        role="search"
        className={cn("w-full", className)}
      >
        <FormField
          control={form.control}
          name="q"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border border-white/15 bg-white/95 shadow-lg shadow-black/10 backdrop-blur focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/30",
                  isHero ? "p-1.5 ps-5" : "p-1 ps-4"
                )}
              >
                <Search
                  aria-hidden
                  className={cn(
                    "shrink-0 text-neutral-500",
                    isHero ? "size-5" : "size-4"
                  )}
                />
                <FormControl>
                  <Input
                    {...field}
                    autoFocus={autoFocus}
                    aria-label="Search 3D models"
                    placeholder={label}
                    className={cn(
                      "border-0 bg-transparent px-0 text-neutral-900 shadow-none placeholder:text-neutral-500 focus-visible:ring-0 dark:bg-transparent",
                      isHero ? "h-11 text-base" : "h-8 text-sm"
                    )}
                  />
                </FormControl>
                <Button
                  type="submit"
                  aria-label={t("search")}
                  disabled={isSearching}
                  className={cn(
                    "shrink-0 rounded-full bg-brand text-brand-foreground hover:bg-brand/85",
                    isHero ? "size-11" : "size-8"
                  )}
                >
                  {isSearching ? (
                    <Loader2
                      className={cn("animate-spin", isHero ? "size-5" : "size-4")}
                      aria-hidden
                    />
                  ) : (
                    <Search className={isHero ? "size-5" : "size-4"} />
                  )}
                </Button>
              </div>
              <FormMessage
                className={cn(
                  "px-4 text-xs",
                  isHero && "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                )}
              />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
