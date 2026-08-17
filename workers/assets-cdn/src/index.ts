/**
 * Public CDN for R2 preview images.
 *
 * Fronts the `modeltree-assets` bucket via a native R2 binding so the app can
 * embed image URLs directly instead of minting a signed GET on every render.
 *
 * URL layout mirrors the bucket key layout:
 *
 *   /<env>/images/<userId>/<uploadId>/<pos>.<ext>   → served publicly
 *   /<env>/models/*                                 → 403 (private, gated by purchase)
 *   anything else                                   → 404
 *
 * `<env>` is `dev` or `prod`. Rejecting anything else means a Worker misroute
 * cannot accidentally leak bucket contents from a different partition. Keys
 * under `images/` embed UUIDs, so `Cache-Control: immutable` is safe — a new
 * upload gets a new key rather than overwriting.
 */

interface Env {
  ASSETS: R2Bucket
  ALLOWED_ORIGINS: string
}

const ALLOWED_ENVS = new Set(["dev", "prod"])
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD", ...corsHeaders(request, env) },
      })
    }

    const url = new URL(request.url)
    const segments = url.pathname.split("/").filter(Boolean)
    // Expected: [env, "images", ...rest] — anything shorter or shaped wrong
    // is a caller error, not something to guess at.
    if (segments.length < 3 || !ALLOWED_ENVS.has(segments[0])) {
      return notFound(request, env)
    }
    if (segments[1] === "models") {
      // Deliberately opaque — do not confirm whether the key exists.
      return forbidden(request, env)
    }
    if (segments[1] !== "images") {
      return notFound(request, env)
    }

    const key = segments.join("/")

    // Conditional GET: honour If-None-Match so browsers can revalidate cheaply.
    // R2 wants the raw etag (no surrounding quotes, no W/ prefix), which is
    // NOT what the HTTP header carries — strip both.
    const ifNoneMatchRaw = request.headers.get("If-None-Match")
    const ifNoneMatch = ifNoneMatchRaw?.replace(/^W\//, "").replace(/^"|"$/g, "")

    // When `onlyIf` fails, R2 returns metadata-only (`R2Object`, no `.body`)
    // instead of null. Null means the key genuinely doesn't exist.
    const result = await env.ASSETS.get(key, {
      onlyIf: ifNoneMatch ? { etagDoesNotMatch: ifNoneMatch } : undefined,
    })
    if (result === null) return notFound(request, env)

    const hasBody = "body" in result && result.body !== undefined
    if (!hasBody) {
      // 304: ETag matched, no body returned. Use metadata for headers.
      return new Response(null, {
        status: 304,
        headers: cacheHeaders(result, request, env),
      })
    }

    // HEAD should share every response header with GET, just no body.
    const body = request.method === "HEAD" ? null : result.body
    return new Response(body, {
      status: 200,
      headers: cacheHeaders(result, request, env),
    })
  },
}

/**
 * Response headers shared by 200 and 304. Uses whatever content-type the
 * upload declared; falls back to octet-stream so a mis-tagged image still
 * downloads instead of getting sniffed to something wrong.
 */
function cacheHeaders(
  object: R2Object,
  request: Request,
  env: Env,
): HeadersInit {
  const contentType =
    object.httpMetadata?.contentType ?? "application/octet-stream"
  return {
    "Content-Type": contentType,
    "Content-Length": String(object.size),
    ETag: object.httpEtag,
    // UUID-keyed objects never change under the same URL — a new upload gets
    // a new key. `immutable` tells browsers not to revalidate for a year.
    "Cache-Control": `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
    // Cloudflare cache respects this too, so edge PoPs share cached responses.
    Vary: "Origin",
    ...corsHeaders(request, env),
  }
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin")
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  if (origin && allowed.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, HEAD",
    }
  }
  // No Origin header (direct <img> load) or an origin we don't recognise —
  // omit CORS headers rather than echoing a wildcard. `<img>` renders either
  // way; only cross-origin `fetch()` needs the header.
  return {}
}

function notFound(request: Request, env: Env): Response {
  return new Response("Not Found", {
    status: 404,
    headers: corsHeaders(request, env),
  })
}

function forbidden(request: Request, env: Env): Response {
  return new Response("Forbidden", {
    status: 403,
    headers: corsHeaders(request, env),
  })
}
