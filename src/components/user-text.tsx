import { cn } from "@/lib/utils"

/**
 * Wraps content written by users (model titles, descriptions, author handles)
 * rather than by us.
 *
 * Listings are English-only while the interface can be Hebrew. Dropping an
 * English string into an RTL paragraph lets direction-neutral characters —
 * full stops, commas, brackets — inherit the paragraph direction and jump to
 * the wrong end: "Wolf, rigged." renders as ".Wolf, rigged". Marking the run
 * LTR and isolating it fixes the whole class of bug in one place, instead of
 * relying on every future component remembering.
 */
export function UserText({
  as: Tag = "span",
  className,
  children,
  ...props
}: {
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div"
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag dir="ltr" data-user-text className={cn(className)} {...props}>
      {children}
    </Tag>
  )
}
