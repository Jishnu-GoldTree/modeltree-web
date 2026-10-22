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
      { key: "rings", href: "/3d-models/rings", icon: "crown" },
      { key: "pendants", href: "/3d-models/pendants", icon: "gem" },
      { key: "earrings", href: "/3d-models/earrings", icon: "sparkles" },
      { key: "bracelets", href: "/3d-models/bracelets", icon: "link" },
      { key: "settings", href: "/3d-models/settings", icon: "building" },
    ],
  },
  {
    label: "Custom work",
    href: "/custom-work",
    children: [
      { key: "adjust", href: "/requests/new?kind=adjustment", icon: "sliders" },
      { key: "commission", href: "/requests/new?kind=commission", icon: "pen" },
      { key: "customOverview", href: "/custom-work", icon: "book" },
    ],
  },
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

export const FOOTER_COLUMNS = [
  {
    key: "shop",
    links: [
      { key: "models", href: "/3d-models" },
      { key: "engagement", href: "/3d-models/engagement-rings" },
      { key: "bands", href: "/3d-models/wedding-bands" },
      { key: "castReady", href: "/3d-models/cast-ready" },
      { key: "printReady", href: "/3d-models/print-ready" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "customWork", href: "/custom-work" },
      { key: "membership", href: "/pricing" },
      { key: "contact", href: "/contact" },
    ],
  },
  {
    key: "help",
    links: [
      { key: "faq", href: "/#faq" },
      { key: "licensing", href: "/licensing" },
      { key: "delivery", href: "/delivery" },
      { key: "refunds", href: "/refunds" },
    ],
  },
  // Every policy one click from the footer: payment-processor reviews (and
  // buyers) expect it, and each points at a page that exists.
  {
    key: "legal",
    links: [
      { key: "terms", href: "/terms" },
      { key: "privacy", href: "/privacy" },
      { key: "cookiePolicy", href: "/cookies" },
    ],
  },
] as const;
