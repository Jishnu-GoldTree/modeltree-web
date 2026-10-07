"use client"

import { useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A native-<details> dropdown whose trigger reflects the current selection.
 *
 * Still server-rendered links inside, so filters stay shareable and work
 * without JS. This thin client wrapper only adds the two behaviours the native
 * element lacks: closing when you click outside it, and closing when you pick
 * an option (selection navigates client-side, which never reloads the element).
 */
export function CatalogMenu({
  label,
  active,
  align = "start",
  children,
}: {
  label: string
  active: boolean
  align?: "start" | "end"
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function onPointerDown(event: PointerEvent) {
      if (el!.open && !el!.contains(event.target as Node)) el!.open = false
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  return (
    <details ref={ref} className="group relative">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm whitespace-nowrap outline-none select-none transition-colors",
          "hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50 [&::-webkit-details-marker]:hidden",
          active && "border-brand bg-brand-muted font-medium text-brand-accent",
        )}
      >
        {label}
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div
        // A click that lands on an option navigates and should take the menu
        // with it; bubbling lets one handler cover every link inside.
        onClick={() => {
          if (ref.current) ref.current.open = false
        }}
        className={cn(
          "absolute z-30 mt-2 max-h-80 min-w-56 overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg",
          align === "end" ? "end-0" : "start-0",
        )}
      >
        {children}
      </div>
    </details>
  )
}
