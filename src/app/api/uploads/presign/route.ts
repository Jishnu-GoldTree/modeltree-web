import { NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentUser } from "@/lib/supabase/server"
import { FORMATS } from "@/lib/data/catalog"
import { modelFileKey, modelImageKey, presignPut } from "@/lib/r2/presign"

/**
 * Mints a presigned PUT URL for a single upload.
 *
 * The client asks per file: "I want to upload this format/image, here's the
 * size and content-type." The server names the key (userId-scoped so a
 * signed-in designer can never target someone else's directory) and returns a
 * URL the browser can PUT to directly. Bytes never touch this handler.
 *
 * Two `kind`s exist because model source files and preview images have
 * different size ceilings and different MIME expectations. Adding a third kind
 * later (e.g. renders, videos) is a matter of a new branch in the schema.
 */

const MODEL_FORMATS = FORMATS.map((f) => f.value) as [string, ...string[]]

// Jewellery CAD files aren't tiny — Rhino/Matrix regularly cross 100 MB — but
// they're not videos either. 500 MB is generous headroom without inviting
// abuse.
const MAX_MODEL_BYTES = 500 * 1024 * 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("model"),
    uploadId: z.uuid(),
    format: z.enum(MODEL_FORMATS),
    /** Extension is captured separately from format because `stl` == `.stl` but
     *  `3dm` files use `.3dm`, `matrix` uses `.mtx`, etc. Trust the client's
     *  extension only for the file name; the format is what the schema keys on. */
    extension: z.string().min(1).max(8).regex(/^[a-z0-9]+$/i),
    size: z.number().int().positive().max(MAX_MODEL_BYTES),
    contentType: z.string().min(1).max(120),
  }),
  z.object({
    kind: z.literal("image"),
    uploadId: z.uuid(),
    position: z.number().int().min(0).max(19),
    extension: z.enum(["jpg", "jpeg", "png", "webp"]),
    size: z.number().int().positive().max(MAX_IMAGE_BYTES),
    contentType: z.enum(IMAGE_TYPES),
  }),
])

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const data = parsed.data

  const storageKey =
    data.kind === "model"
      ? modelFileKey({
          userId: user.id,
          uploadId: data.uploadId,
          format: data.format,
          extension: data.extension,
        })
      : modelImageKey({
          userId: user.id,
          uploadId: data.uploadId,
          position: data.position,
          extension: data.extension,
        })

  const url = await presignPut({
    storageKey,
    contentType: data.contentType,
    contentLength: data.size,
  })

  return NextResponse.json(
    { url, storageKey },
    { headers: { "Cache-Control": "no-store" } },
  )
}
