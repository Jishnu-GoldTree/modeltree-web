/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader for offline TypeScript fixtures. */
// Offline regression tests: execute the real catalog against a counted fake DB.
// Run: node --test scripts/test-resource-usage.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { AsyncLocalStorage } = require('node:async_hooks')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')

function harness(size = 1205, extraMocks = {}) {
  const rows = Array.from({ length: size }, (_, i) => ({
    id: String(i), status: 'published', title: `ring ${i}`, tags: i % 3 ? ['ring'] : [],
    price_cents: i % 2 ? 100 : 0, production: i % 3 ? 'both' : 'print',
    metal: i % 2 ? 'silver' : 'yellow-gold', stone: i % 3 ? 'round' : 'none',
    formats: i % 2 ? ['stl', 'obj'] : ['stl'],
    license_code: i % 4 ? 'standard' : 'extended',
    categories: { slug: i % 2 ? 'rings' : 'pendants' },
  }))
  const calls = { facets: 0, lists: 0, categories: 0 }
  let failFacet = false
  class Builder {
    constructor(table) { this.table = table; this.predicates = []; this.from = 0; this.to = Infinity }
    select(select) { this.fields = select; return this }
    eq(k, v) { this.predicates.push(r => (k === 'categories.slug' ? r.categories?.slug : r[k]) === v); return this }
    gt(k, v) { this.predicates.push(r => r[k] > v); return this }
    in(k, vs) { this.predicates.push(r => vs.includes(r[k])); return this }
    contains(k, vs) { this.predicates.push(r => vs.every(v => r[k]?.includes(v))); return this }
    or(expression) {
      const term = expression.match(/title.ilike.\*(.*?)\*/)[1]
      this.predicates.push(r => r.title.toLowerCase().includes(term) || r.tags.includes(term)); return this
    }
    order() { return this }
    range(from, to) { this.from = from; this.to = to; return this }
    then(resolve, reject) {
      return new Promise(r => setTimeout(r, 1)).then(() => {
        if (this.table === 'categories') {
          calls.categories++
          return { data: ['rings', 'pendants', 'empty'].map(slug => ({ id: slug, slug, label: slug })), error: null }
        }
        if (!this.fields.startsWith('metal, stone, formats, license_code')) {
          calls.lists++
          return { data: [], count: 0, error: null }
        }
        calls.facets++
        if (failFacet) { failFacet = false; return { data: null, count: null, error: { message: 'offline' } } }
        const data = rows.filter(r => this.predicates.every(p => p(r)))
        return { data: data.slice(this.from, this.to + 1), count: data.length, error: null }
      }).then(resolve, reject)
    }
  }
  const modules = new Map()
  const cacheContext = new AsyncLocalStorage()
  const mocks = {
    react: { cache: f => f },
    'server-only': {},
    'next/cache': { unstable_cache: fn => {
      const cache = new Map()
      return async (...args) => {
        const key = JSON.stringify(args)
        // Next deliberately bypasses nested unstable_cache reads. Match that
        // behavior so wrapping the facet-page cache in another cache is caught.
        if (!cacheContext.getStore() && cache.has(key)) return structuredClone(cache.get(key))
        const result = await cacheContext.run(true, () => fn(...args))
        cache.set(key, structuredClone(result))
        return result
      }
    } },
    '@/lib/supabase/public': { supabasePublic: { from: table => new Builder(table) } },
    '@/lib/supabase/server': { createClient: () => { throw Error('Private data must not be queried') }, getCurrentUser: async () => null },
    '@/lib/r2/presign': { previewImageUrl: async key => key },
  }
  Object.assign(mocks, extraMocks)
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports
    const mod = { exports: {} }; modules.set(file, mod)
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    const localRequire = id => {
      if (id in mocks) return mocks[id]
      if (id.startsWith('@/')) return load(path.join(root, 'src', id.slice(2)) + '.ts')
      if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id) + '.ts')
      return require(id)
    }
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, mod, mod.exports)
    return mod.exports
  }
  return { rows, calls, load, failNextFacet: () => { failFacet = true }, catalog: load(path.join(root, 'src/lib/data/catalog.ts')) }
}

function reference(rows, query) {
  const { FORMATS, METALS, STONES } = requireFacets()
  const values = {
    categories: ['rings', 'pendants', 'empty'], formats: FORMATS.map(f => f.value),
    licenses: ['standard', 'extended'], metals: METALS.filter(m => m !== 'unspecified'), stones: STONES.filter(s => s !== 'none'),
  }
  const fields = { categories: 'category', formats: 'format', licenses: 'license', metals: 'metal', stones: 'stone' }
  function matches(row, q) {
    return (!q.category || row.categories?.slug === q.category)
      && (!q.format || row.formats?.includes(FORMATS.find(f => f.value === q.format)?.value))
      && (!q.license || row.license_code === q.license)
      && (!q.metal || row.metal === q.metal) && (!q.stone || row.stone === q.stone)
      && (!q.price || (q.price === 'free' ? row.price_cents === 0 : row.price_cents > 0))
      && (!q.production || q.production === 'both' || [q.production, 'both'].includes(row.production))
      && (!q.tag || row.tags.includes(q.tag))
      && (!q.q || row.title.includes(q.q) || row.tags.includes(q.q))
  }
  return Object.fromEntries(Object.entries(values).map(([dimension, keys]) => [dimension,
    Object.fromEntries(keys.map(key => [key, rows.filter(row => matches(row, { ...query, [fields[dimension]]: key })).length])),
  ]))
}
let vocab
function requireFacets() { return vocab ??= harness(0).load(path.join(root, 'src/lib/data/catalog-facets.ts')) }

test('20 concurrent renders share DB reads; filters and sorting reuse paginated facets', async () => {
  const h = harness()
  const results = await Promise.all(Array.from({ length: 20 }, () => h.catalog.queryModels({})))
  assert.deepEqual(results[0].facets, reference(h.rows, {}))
  assert.deepEqual(h.calls, { facets: 3, lists: 1, categories: 1 })
  for (const query of [{ metal: 'silver' }, { category: 'rings', format: 'obj', stone: 'round' }, { license: 'extended' }, { page: 2, sort: 'newest' }]) {
    assert.deepEqual((await h.catalog.queryModels(query)).facets, reference(h.rows, query))
  }
  assert.equal(h.calls.facets, 3)
  assert.equal(h.calls.categories, 1)
})

test('free/paid, production, tag and text retain disjunctive count semantics', async () => {
  const h = harness()
  for (const query of [
    { price: 'free', metal: 'silver' }, { price: 'paid', category: 'rings', production: 'cast' },
    { production: 'print', format: 'obj' }, { tag: 'ring', stone: 'round' },
    { q: 'ring 12', license: 'extended' }, { q: 'missing' },
  ]) assert.deepEqual((await h.catalog.queryModels(query)).facets, reference(h.rows, query))
})

test('canonical URLs share caches; infinite scroll skips facets entirely', async () => {
  const h = harness(72)
  await h.catalog.queryModels({}, { facets: false })
  assert.deepEqual(h.calls, { facets: 0, lists: 1, categories: 0 })
  await h.catalog.queryModels({ sort: 'trending', page: 1, format: 'invalid' }, { facets: false })
  assert.equal(h.calls.lists, 1)
  await h.catalog.queryModels({ q: '  RING  ', tag: ' RING ' })
  const previous = { ...h.calls }
  await h.catalog.queryModels({ tag: 'ring', q: 'ring', page: 1 })
  assert.deepEqual(h.calls, previous)
})

test('failed reads throw, are not cached as zero, and recover on the next request', async () => {
  const h = harness(72)
  h.failNextFacet()
  await assert.rejects(h.catalog.queryModels({}), /offline/)
  const result = await h.catalog.queryModels({})
  assert.deepEqual(result.facets, reference(h.rows, {}))
  assert.equal(h.calls.facets, 2)
})


function gridHarness(loadPage) {
  const hooks = []
  const effects = []
  const transitions = []
  let index = 0
  let observeCount = 0
  let observerCallback
  const changed = (a, b) => !a || a.some((value, i) => !Object.is(value, b[i]))
  const react = {
    Fragment: Symbol.for('react.fragment'),
    useState(initial) {
      const i = index++
      if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial
      return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value }]
    },
    useRef(initial) {
      const i = index++
      // A DOM sentinel is attached by React before effects run.
      return hooks[i] ??= { current: initial === null ? {} : initial }
    },
    useCallback(fn, deps) {
      const i = index++
      if (!hooks[i] || changed(hooks[i].deps, deps)) hooks[i] = { fn, deps }
      return hooks[i].fn
    },
    useEffect(fn, deps) {
      const i = index++
      if (!hooks[i] || changed(hooks[i].deps, deps)) {
        hooks[i]?.cleanup?.()
        hooks[i] = { deps }
        effects.push(() => { hooks[i].cleanup = fn() })
      }
    },
    useTransition() {
      const [pending, setPending] = react.useState(false)
      return [pending, fn => {
        setPending(true)
        transitions.push(fn().finally(() => setPending(false)))
      }]
    },
    cache: fn => fn,
  }
  const previousObserver = global.IntersectionObserver
  global.IntersectionObserver = class {
    constructor(callback) { observerCallback = callback }
    observe() { observeCount++ }
    disconnect() {}
  }
  const h = harness(0, {
    react,
    'lucide-react': { Loader2: () => null },
    '@/components/marketplace/model-card': { ModelCard: () => null },
    '@/lib/actions/catalog': { loadCatalogPage: loadPage },
  })
  const { CatalogGrid } = h.load(path.join(root, 'src/components/marketplace/catalog-grid.tsx'))
  const props = {
    initialItems: [], initialFavoritedSlugs: [], params: {}, patch: {},
    initialPage: 1, pageCount: 10, promo: null, loadMoreLabel: 'More', errorLabel: 'Retry',
  }
  return {
    render() {
      index = 0
      const tree = CatalogGrid(props)
      effects.splice(0).forEach(effect => effect())
      return tree
    },
    intersect: () => observerCallback([{ isIntersecting: true }]),
    settle: () => Promise.all(transitions),
    observations: () => observeCount,
    cleanup: () => { global.IntersectionObserver = previousObserver },
  }
}

function button(tree) {
  if (!tree || typeof tree !== 'object') return undefined
  if (tree.type === 'button') return tree
  return [tree.props?.children].flat(Infinity).map(button).find(Boolean)
}

test('infinite scroll coalesces observer events, stops after failure, and allows manual retry', async () => {
  let calls = 0
  const h = gridHarness(async () => {
    calls++
    if (calls === 1) throw Error('offline')
    return { items: [], favoritedSlugs: [], pageCount: 10 }
  })
  try {
    h.render()
    h.intersect()
    h.intersect()
    assert.equal(calls, 1)
    h.render() // pending
    await h.settle()
    const failed = h.render()
    assert.equal(h.observations(), 1, 'failure must not re-observe a visible sentinel')
    button(failed).props.onClick()
    await h.settle()
    assert.equal(calls, 2)
    assert.equal(button(h.render()), undefined, 'empty page must end loading despite stale pageCount')
  } finally { h.cleanup() }
})

test('infinite scroll respects the updated server page count', async () => {
  const h = gridHarness(async () => ({ items: [{ slug: 'last' }], favoritedSlugs: [], pageCount: 2 }))
  try {
    h.render()
    h.intersect()
    await h.settle()
    assert.equal(button(h.render()), undefined)
  } finally { h.cleanup() }
})

test('one auth listener ignores initialization, token refresh and repeated sign-in notifications', async () => {
  let callback, cleanup, subscriptions = 0, invalidations = 0
  const h = harness(0, {
    react: { cache: fn => fn, useEffect: fn => { cleanup = fn() } },
    '@tanstack/react-query': {
      useQuery: () => ({}),
      useQueryClient: () => ({ invalidateQueries: () => { invalidations++ } }),
    },
    '@/lib/supabase/client': { createClient: () => ({ auth: {
      onAuthStateChange: cb => { callback = cb; subscriptions++; return { data: { subscription: { unsubscribe() {} } } } },
    } }) },
  })
  const { useViewer, useViewerAuthSync } = h.load(path.join(root, 'src/lib/queries/viewer.ts'))
  useViewerAuthSync()
  useViewer(); useViewer(); useViewer()
  assert.equal(subscriptions, 1)
  const user = { user: { id: 'buyer' } }
  callback('INITIAL_SESSION', user)
  callback('SIGNED_IN', user)
  callback('TOKEN_REFRESHED', user)
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(invalidations, 0)
  callback('SIGNED_OUT', null)
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(invalidations, 1)
  callback('SIGNED_IN', user)
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(invalidations, 2)
  callback('USER_UPDATED', user)
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(invalidations, 3)
  cleanup()
})
