import { Link } from "@/i18n/navigation";

import { cn } from "@/lib/utils";
import { SITE } from "@/lib/data/landing";

/**
 * MODELTREE wordmark.
 *
 * The glyph is the same solitaire the admin uses in its sidebar header —
 * identical paths, identical viewBox — so the two products carry one mark.
 * Seen from the side rather than in plan: table and crown above the girdle, the
 * pavilion falling to a point below it, drawn as a wireframe.
 *
 * It replaced an isometric cube, the build volume every model sits in. That was
 * an honest mark for a general 3D marketplace and said nothing about this one.
 * The business is jewellery, and what it actually trades in is geometry, so the
 * mark is a stone drawn the way a CAD file draws one.
 *
 * Strokes are currentColor, and `tone` picks it:
 *
 *   light — on the ink header, gold, exactly as the admin sidebar renders it.
 *   dark  — on white, gold measures 2.01:1 and a hairline wireframe in it
 *           disappears, so the glyph takes the foreground ink instead. Same
 *           geometry, legible ground. Only the colour differs between the two.
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
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={cn(
          "size-7 shrink-0",
          tone === "light" ? "text-brand" : "text-foreground",
        )}
      >
        <path
          d="M4 9.5 12 3l8 6.5-8 12-8-12Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4 9.5h16M12 3 8.5 9.5 12 21.5 15.5 9.5 12 3Z"
          stroke="currentColor"
          strokeWidth="1.2"
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
