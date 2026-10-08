"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/**
 * Phone-width home for the catalog filters. The groups themselves are
 * server-rendered links passed in as children — the same URLs the desktop
 * dropdowns use — so this only owns open/closed. Following any link inside
 * closes the sheet, since the page behind it is about to change.
 */
export function FilterSheet({
  label,
  title,
  activeCount,
  children,
}: {
  label: string
  title: string
  activeCount: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 gap-2">
          <SlidersHorizontal className="size-4" aria-hidden />
          {label}
          {activeCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-2xl p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div
          className="flex flex-col gap-6 px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false)
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
