# Supabase request audit — 2026-09-16

The supplied screenshot shows 709 successful API gateway requests in a minute,
mostly server-side catalog/category reads. That establishes a burst, but does not
identify the originating page requests or prove an infinite browser loop. The
local checkout was behind GitHub main. The newer commits were integrated before
these changes, preserving static landing statistics, lowercase stored formats,
prerendering improvements and local JWT verification. The following remaining
sources of amplification were addressed.

| Source | Change |
| --- | --- |
| Each uncached filter set fetched up to five overlapping facet row sets; the original checkout issued roughly 30 count queries | Count facets from narrow public rows, cached in 500-row pages shared across those five filter dimensions. Preserve other filters and each dimension's self-exclusion. |
| Links in menus, grids, header and footer could prefetch database-backed pages | Shared locale-aware Link defaults to `prefetch={false}`. Navigation still works; destinations load on click. |
| Infinite-scroll observer could reattach immediately after a failure | Stop automatic retries after errors; allow a manual retry. A synchronous lock prevents duplicate requests. Respect updated page count and stop on an empty page. |
| Uncached category resolution in metadata and pages, file summaries, designer storefronts and pricing | Cache anonymous public data for one hour and invalidate on catalog writes. Category metadata and page resolution share reads. Profile writes invalidate cached public profile information. |
| Simultaneous requests missing the same cache entry | Share the pending public read within each server process. Failed reads are released for later recovery. This is not a distributed lock across server instances. |
| Every viewer hook subscribed to every auth event | Subscribe once in Providers. Ignore initialization, token refresh, and repeated same-user sign-in events; refresh on identity/profile changes. Retain server-side user verification. |
| Existing upstream auth/cache improvements | Preserve request-scoped caching and verified claims; do not reintroduce per-render network user verification. |
| Toast URL cleanup rerendered the server page | Remove the flash parameter with native history replacement. |
| Saving a favorite invalidated public catalog data | Keep the cookie/router refresh without expiring the catalog path. |
| Admin idle job queues polled every ten seconds | Poll active rows every ten seconds, idle rows once a minute; stop interval polling on errors. Cancel obsolete list/search fetches and disable closed search popovers. |

Next 16.3's `unstable_cache` bypasses nested cache reads. Facet page reads are
therefore intentionally outside an outer cached facet computation. The offline
cache test models that behavior so it cannot silently regress.

Validation: `node --test scripts/test-resource-usage.cjs` covers concurrency,
cache reuse, facet semantics, pagination beyond 1,000 rows, failed-read recovery,
scroll retries and auth notifications. The 1,205-row fixture requires three facet
queries total for 20 concurrent initial renders; later category/format/metal/sort
changes issue no further facet queries. These are offline measurements, not
observations of production traffic. All seven regression tests, targeted lint
and TypeScript checks pass. A clean Next.js production build passed with
populated offline Supabase fixtures and mocked Google Fonts, avoiding production
database traffic during validation.

Deployment: deploy ModelTreeWeb for the storefront fixes and modeltree-admin for
polling changes. No database migration is required. Public cached values can lag
out-of-band/admin edits by up to the existing one-hour TTL; the two deployments do
not share invalidation. After deployment, compare one-minute Supabase API counts
for an idle tab, opening filter menus, actual filter navigation and scrolling.
The first request after deployment/invalidation warms caches. Multiple server
instances can each issue a cold request. Production traffic and bot behavior
must be checked in hosting/Supabase logs to verify the overall reduction.
