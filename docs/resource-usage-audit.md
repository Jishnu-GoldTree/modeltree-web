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

## Follow-up: filtered listing traffic and metadata routing

The follow-up screenshot contains 174 gateway requests in its selected minute,
versus 709 in the first screenshot. This is about 75% fewer requests, but the
traffic windows are not a controlled comparison. The supplied event at
2026-09-16T11:21:59.694Z is a public, server-side catalog listing read with
category `findings`, free price, standard license, rose-gold metal, pear stone,
print/both production, and the search term `סוליטר`. `offset=0&limit=24` identifies
page one. This matches `listModelsCached`, not a product-detail or facet-count
read. The `node` user agent identifies the database caller, not the original
website visitor. It does not prove the visitor was a crawler.

A concrete routing bug was reproduced using the installed Next.js matcher and
next-intl proxy: `/robots.txt` matched the proxy and rewrote to `/he/robots.txt`;
`/sitemap.xml` similarly rewrote to `/he/sitemap.xml`. Neither locale destination
exists. The root metadata handlers therefore could not serve their intended
responses through that routing configuration. This can expose a faceted crawl
space to crawlers that would otherwise obey the query-string restriction.
The catalog toolbar emits links that retain existing filters while changing
one dimension, so following those links can generate many unique combinations.
The cache is shared between locales, but each distinct filter combination
still requires a cold listing read.

The proxy now excludes both root metadata routes. Query-bearing toolbar links
and filter-removal links also carry `nofollow` hints; these supplement robots
rules and are not enforcement against crawlers that ignore them. Clean category
and product links remain discoverable.

Validation: all eight offline resource tests pass, including the actual Next
matcher for metadata URLs with and without query strings, both catalog locales,
API/auth callbacks and dotted designer handles. A separate execution using the
real next-intl handler confirms the metadata exclusions while Hebrew catalog
rewrites and English routing remain intact. A live `robots.txt` probe returned
Vercel's 429 Security Checkpoint, so it did not verify the deployed app response.

Deploy the storefront change, verify a 200 text/plain robots response and a 200
XML sitemap response, and correlate hosting requests around 11:21:59 UTC with
the supplied event. Adjacent full database query URLs distinguish new filter
combinations from repeated identical cache misses. Hosting user agents and
request paths are needed to establish the traffic source. This follow-up does
not establish that a crawler caused the particular burst or that production
request volume has dropped further.
