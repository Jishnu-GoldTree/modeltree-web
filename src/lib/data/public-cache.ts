import { unstable_cache } from "next/cache"

// Only for anonymous public reads. Concurrent cache misses in the same server
// process share one pending read; completed values live in Next's Data Cache.
// Rejected reads are removed so a later request can recover.
export function publicCache<Args extends unknown[], Result>(
  read: (...args: Args) => Promise<Result>,
  keys: string[],
  options: { revalidate: number; tags: string[] },
) {
  const pending = new Map<string, Promise<Result>>()
  return unstable_cache(async (...args: Args): Promise<Result> => {
    const key = JSON.stringify(args)
    const existing = pending.get(key)
    if (existing) return existing
    const promise = Promise.resolve().then(() => read(...args))
    pending.set(key, promise)
    try {
      return await promise
    } finally {
      pending.delete(key)
    }
  }, [...keys, read.toString()], options)
}
