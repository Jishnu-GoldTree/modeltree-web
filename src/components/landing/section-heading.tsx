import { Link } from "@/i18n/navigation"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

export function SectionHeading({
  title,
  description,
  action,
  className,
  align = "start",
}: {
  title: string
  description?: string
  action?: { label: string; href: string }
  className?: string
  align?: "start" | "center"
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className
      )}
    >
      <div className={cn(align === "center" && "max-w-2xl")}>
        <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {action.label}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"
          />
        </Link>
      )}
    </div>
  )
}
