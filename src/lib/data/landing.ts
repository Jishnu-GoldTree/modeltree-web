/**
 * Static content for the MODELTREE landing page.
 * Everything here is placeholder copy/figures standing in for what will later
 * come from the catalog service. Keeping it in one module means the section
 * components stay presentational and swap over to real data in one place.
 */

export type CategoryTile = {
  slug: string;
  /** Message key under `landing.categories`. */
  key: string;
  /** Seed for the generated thumbnail gradient — keeps tiles stable across renders. */
  seed: string;
  /** Catalog preview. Cards fall back to the shared cover when unset. */
  cover?: string;
};

export type ModelCard = {
  slug: string;
  title: string;
  author: string;
  price: number | "free";
  rating: number;
  reviews: number;
  formats: string[];
  badge?: string;
  seed: string;
  /** Catalog preview. Cards fall back to the shared cover when unset. */
  cover?: string;
};

/** Icon names for megamenu children; mapped to lucide components in the header. */
export type NavChildIcon =
  | "grid" | "diamond" | "circle" | "gem" | "sparkles" | "crown"
  | "flame" | "printer" | "link" | "gift"
  | "sliders" | "pen" | "building"
  | "store" | "dashboard" | "book";

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: { key: string; href: string; icon: NavChildIcon }[];
};

export const SITE = {
  name: "MODELTREE",
  // Jewellery-first, because that is the business: GoldTree is a gold trading
  // company with an in-house library of 40,000 jewellery models built by four
  // designers over two years. Claims here must stay defensible — the earlier
  // "world's largest" was invented placeholder and had to go.
  tagline: "40,000 jewellery models, cast-ready and yours to license",
  description:
    "A jewellery-first 3D marketplace from GoldTree. Rings, pendants and settings modelled in-house for casting and print, plus a wider catalog of production-ready assets, or commission exactly what you need.",
} as const;

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Jewellery",
    href: "/3d-models",
    children: [
      { key: "allModels", href: "/3d-models", icon: "grid" },
      { key: "engagement", href: "/3d-models/engagement-rings", icon: "diamond" },
      { key: "bands", href: "/3d-models/wedding-bands", icon: "circle" },
      { key: "pendants", href: "/3d-models/pendants", icon: "gem" },
      { key: "earrings", href: "/3d-models/earrings", icon: "sparkles" },
      { key: "settings", href: "/3d-models/settings", icon: "crown" },
    ],
  },
  {
    label: "Production",
    href: "/3d-models/cast-ready",
    children: [
      { key: "castReady", href: "/3d-models/cast-ready", icon: "flame" },
      { key: "printReady", href: "/3d-models/print-ready", icon: "printer" },
      { key: "findings", href: "/3d-models/findings", icon: "link" },
      { key: "freeModels", href: "/3d-models/free", icon: "gift" },
    ],
  },
  {
    label: "Custom work",
    href: "/custom-work",
    children: [
      { key: "adjust", href: "/custom-work/adjust", icon: "sliders" },
      { key: "commission", href: "/custom-work/commission", icon: "pen" },
      { key: "enterprise", href: "/business", icon: "building" },
    ],
  },
  {
    label: "For Designers",
    href: "/designers",
    children: [
      { key: "startSelling", href: "/sell", icon: "store" },
      { key: "dashboard", href: "/dashboard", icon: "dashboard" },
      { key: "guidelines", href: "/guidelines", icon: "book" },
    ],
  },
];

export const HERO_FILTERS = [
  { key: "engagement", href: "/3d-models/engagement-rings" },
  { key: "bands", href: "/3d-models/wedding-bands" },
  { key: "castReady", href: "/3d-models/cast-ready" },
  { key: "printReady", href: "/3d-models/print-ready" },
  { key: "yellowGold", href: "/3d-models?metal=yellow-gold" },
  { key: "settings", href: "/3d-models/settings" },
  { key: "free", href: "/3d-models/free" },
];

/** Chip rows are translated search terms, so they carry keys, not literals. */
export const ASSET_TABS = [
  "solitaire", "halo", "eternity", "signet",
  "hamsa", "tennis", "cuban", "milgrain",
];

/**
 * Category tiles. Counts are deliberately absent: the previous list carried
 * invented figures ("128K") that a real catalog of 56 could never back up.
 * The catalog page shows live facet counts instead.
 */
export const ASSET_CATEGORIES: CategoryTile[] = [
  { slug: "engagement-rings", key: "engagement-rings", seed: "cat-engagement" },
  { slug: "wedding-bands", key: "wedding-bands", seed: "cat-bands" },
  { slug: "rings", key: "rings", seed: "cat-rings" },
  { slug: "pendants", key: "pendants", seed: "cat-pendants" },
  { slug: "earrings", key: "earrings", seed: "cat-earrings" },
  { slug: "bracelets", key: "bracelets", seed: "cat-bracelets" },
  { slug: "necklaces", key: "necklaces", seed: "cat-necklaces" },
  { slug: "settings", key: "settings", seed: "cat-settings" },
  { slug: "findings", key: "findings", seed: "cat-findings" },
];

export const COLLECTIONS = [
  { slug: "engagement-rings", key: "models", seed: "collection-engagement" },
  { slug: "wedding-bands", key: "print", seed: "collection-bands" },
] as const;

export const FEATURED_DESIGNER = {
  name: "kamarabay.com",
  handle: "@kamarabay",
  rating: 4.9,
  reviews: 1284,
  models: 312,
  since: "2019",
  tags: ["tagCharacters", "tagRigged", "tagGameReady", "tagPbr"],
  works: [
    { seed: "kam-1", key: "work1", price: 149 },
    { seed: "kam-2", key: "work2", price: 89 },
    { seed: "kam-3", key: "work3", price: 119 },
    { seed: "kam-4", key: "work4", price: 199 },
  ],
};

/** Metal is the first thing a jeweler narrows by. Counts come from the DB. */
export const BROWSE_BY_METAL = [
  { key: "yellow-gold", href: "/3d-models?metal=yellow-gold" },
  { key: "white-gold", href: "/3d-models?metal=white-gold" },
  { key: "rose-gold", href: "/3d-models?metal=rose-gold" },
  { key: "platinum", href: "/3d-models?metal=platinum" },
  { key: "silver", href: "/3d-models?metal=silver" },
];

export const BROWSE_BY_STONE = [
  { key: "round", href: "/3d-models?stone=round" },
  { key: "princess", href: "/3d-models?stone=princess" },
  { key: "oval", href: "/3d-models?stone=oval" },
  { key: "emerald", href: "/3d-models?stone=emerald" },
  { key: "pear", href: "/3d-models?stone=pear" },
  { key: "marquise", href: "/3d-models?stone=marquise" },
  { key: "cushion", href: "/3d-models?stone=cushion" },
];

export const VALUE_PROPS = [
  { key: "a", icon: "layers" },
  { key: "b", icon: "tag" },
  { key: "c", icon: "badge-check" },
] as const;

export const CUSTOM_SOLUTIONS = [
  { key: "modelry", steps: [1, 2, 3], benefits: [1, 2, 3, 4] },
  { key: "projects", steps: [1, 2, 3], benefits: [1, 2, 3] },
] as const;

/**
 * The three checks a jeweler actually runs on a model before buying it.
 *
 * Order matters and is not arbitrary: a mesh that is not closed cannot be
 * sliced at all, dimensions decide whether it is the right piece, and the
 * production method decides whether these files are usable. Each stage is
 * pointless if the one before it fails.
 */
export const CRAFT_POINTS = [
  { key: "watertight", icon: "scan" },
  { key: "dimensions", icon: "ruler" },
  { key: "production", icon: "gem" },
] as const;

export const BUSINESS_PERKS = [
  { key: "a", icon: "users" },
  { key: "b", icon: "credit-card" },
  { key: "c", icon: "file-check" },
] as const;

export const TRUSTED_BY = [
  "Meta",
  "SONY",
  "Google",
  "amazon",
  "NETFLIX",
  "ROBLOX",
  "Microsoft",
  "Disney",
  "SAMSUNG",
  "WebFlix",
];

export const FOOTER_COLUMNS = [
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "careers", href: "/careers" },
      { key: "press", href: "/press" },
      { key: "blog", href: "/blog" },
      { key: "contact", href: "/contact" },
    ],
  },
  {
    key: "marketplace",
    links: [
      { key: "membership", href: "/pricing" },
      { key: "customWork", href: "/custom-work" },
      { key: "models", href: "/3d-models" },
      { key: "engagement", href: "/3d-models/engagement-rings" },
      { key: "bands", href: "/3d-models/wedding-bands" },
      { key: "castReady", href: "/3d-models/cast-ready" },
      { key: "freeModels", href: "/3d-models/free" },
    ],
  },
  {
    key: "forDesigners",
    links: [
      { key: "startSelling", href: "/sell" },
      { key: "royalties", href: "/sell/royalties" },
      { key: "guidelines", href: "/guidelines" },
      { key: "forum", href: "/forum" },
      { key: "challenges", href: "/challenges" },
    ],
  },
  {
    key: "support",
    links: [
      { key: "help", href: "/help" },
      { key: "licensing", href: "/licensing" },
      { key: "refunds", href: "/refunds" },
      { key: "report", href: "/report" },
      { key: "status", href: "/status" },
    ],
  },
] as const;
