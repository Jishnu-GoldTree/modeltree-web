import Link from "next/link";

import { cn } from "@/lib/utils";
import { SITE } from "@/lib/data/landing";

/**
 * MODELTREE wordmark. The glyph is an isometric cube drawn as three rhombus
 * faces — the build volume every model sits in.
 */
export function Logo({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} home`}
      className={cn(
        "group flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-brand/50",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        className="size-7 shrink-0"
        aria-hidden
        fill="none"
      >
        <path
          d="M16 2.5 29 10v12L16 29.5 3 22V10L16 2.5Z"
          fill="currentColor"
          opacity={0.14}
        />
        <path d="M16 2.5 29 10 16 17.5 3 10 16 2.5Z" fill="var(--brand)" />
        <path
          d="M3 10v12l13 7.5V17.5L3 10Z"
          fill="currentColor"
          opacity={0.75}
        />
        <path
          d="M29 10v12l-13 7.5V17.5L29 10Z"
          fill="currentColor"
          opacity={0.45}
        />
      </svg>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        MODEL<span className="text-brand">TREE</span>
      </span>
    </Link>
  );
}
