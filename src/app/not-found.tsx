import Link from "next/link"

/**
 * Root 404 for URLs that never matched a locale segment. The rich, branded 404
 * lives at `[locale]/not-found.tsx`; this one only catches requests that fall
 * outside the locale tree entirely, so it must render its own <html>.
 *
 * Plain `next/link`, not next-intl's. next-intl's Link resolves the current
 * locale to decide whether to prefix the href, and this page renders where
 * there is no `[locale]` segment to resolve — the lookup has nothing to read
 * and the page cannot prerender. The destination is the unprefixed root either
 * way, which is the Hebrew default.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", margin: 0 }}>Page not found</h1>
          <p style={{ marginTop: "0.75rem" }}>
            <Link href="/">Back to ModelTree</Link>
          </p>
        </div>
      </body>
    </html>
  )
}
