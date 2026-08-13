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
  count: string;
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

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: { key: string; href: string }[];
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
    label: "3D Models",
    href: "/3d-models",
    children: [
      { key: "allModels", href: "/3d-models" },
      { key: "freeModels", href: "/3d-models/free" },
      { key: "textures", href: "/textures" },
      { key: "rigged", href: "/3d-models/rigged" },
      { key: "lowPoly", href: "/3d-models/low-poly" },
      { key: "scanned", href: "/3d-models/scanned" },
    ],
  },
  {
    label: "3D Printing",
    href: "/3d-print-models",
    children: [
      { key: "printReady", href: "/3d-print-models" },
      { key: "freeStl", href: "/3d-print-models/free" },
      { key: "miniatures", href: "/3d-print-models/miniatures" },
      { key: "functional", href: "/3d-print-models/functional" },
    ],
  },
  {
    label: "Custom 3D",
    href: "/custom-work",
    children: [
      { key: "modelry", href: "/custom-work/modelry" },
      { key: "projects", href: "/custom-work/projects" },
      { key: "enterprise", href: "/business" },
    ],
  },
  {
    label: "For Designers",
    href: "/designers",
    children: [
      { key: "startSelling", href: "/sell" },
      { key: "dashboard", href: "/dashboard" },
      { key: "guidelines", href: "/guidelines" },
    ],
  },
];

export const HERO_FILTERS = [
  { key: "trending", href: "/3d-models?sort=trending" },
  { key: "blender", href: "/3d-models?software=blender" },
  { key: "textures", href: "/textures" },
  { key: "rigged", href: "/3d-models?rigged=1" },
  { key: "animated", href: "/3d-models?animated=1" },
  { key: "free", href: "/3d-models/free" },
  { key: "lowPoly", href: "/3d-models/low-poly" },
];

/** Chip rows are translated search terms, so they carry keys, not literals. */
export const ASSET_TABS = [
  "trending", "business", "deliveryRobot", "cinema",
  "houseExterior", "comicBook", "store", "restaurant",
];

export const PRINT_TABS = [
  "trending", "dndTools", "jewelryMold", "europe", "cars",
  "batteries", "anime", "vintage", "toyHolders",
];

export const ASSET_CATEGORIES: CategoryTile[] = [
  { slug: "exterior", key: "exterior", count: "128K", seed: "exterior-a" },
  { slug: "car", key: "car", count: "94K", seed: "car-b" },
  { slug: "aircraft", key: "aircraft", count: "31K", seed: "aircraft-c" },
  { slug: "furniture", key: "furniture", count: "212K", seed: "furniture-d" },
  { slug: "military", key: "military", count: "48K", seed: "military-e" },
  { slug: "character", key: "character", count: "76K", seed: "character-f" },
  { slug: "animal", key: "animal", count: "39K", seed: "animal-g" },
  { slug: "plant", key: "plant", count: "57K", seed: "plant-h" },
  { slug: "food", key: "food", count: "44K", seed: "food-i" },
];

export const PRINT_CATEGORIES: CategoryTile[] = [
  { slug: "art", key: "art", count: "62K", seed: "art-j" },
  { slug: "games-toys", key: "gamesToys", count: "88K", seed: "games-k" },
  { slug: "jewelry", key: "jewelry", count: "27K", seed: "jewelry-l" },
  { slug: "miniatures", key: "miniatures", count: "103K", seed: "mini-m" },
  { slug: "hobby-diy", key: "hobbyDiy", count: "45K", seed: "hobby-n" },
  { slug: "fashion", key: "fashion", count: "19K", seed: "fashion-o" },
  { slug: "buildings", key: "buildings", count: "34K", seed: "build-p" },
  { slug: "house", key: "house", count: "51K", seed: "house-q" },
  { slug: "tools", key: "tools", count: "72K", seed: "tools-r" },
];

export const COLLECTIONS = [
  { slug: "3d-model-collections", key: "models", seed: "collection-characters" },
  { slug: "3d-print-collections", key: "print", seed: "collection-cars" },
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

export const BROWSE_BY_TYPE = [
  { key: "animated", count: "84K", href: "/3d-models?animated=1" },
  { key: "rigged", count: "61K", href: "/3d-models?rigged=1" },
  { key: "pbr", count: "156K", href: "/3d-models?pbr=1" },
  { key: "lowPoly", count: "203K", href: "/3d-models/low-poly" },
  { key: "printModels", count: "412K", href: "/3d-print-models" },
  { key: "textures", count: "77K", href: "/textures" },
  { key: "pbrTextures", count: "52K", href: "/textures?pbr=1" },
  { key: "scripts", count: "3.1K", href: "/scripts" },
  { key: "scanned", count: "12K", href: "/3d-models/scanned" },
  { key: "vr", count: "29K", href: "/3d-models?vr=1" },
];

/** Format names are product names, so they stay as literals in both locales. */
export const BROWSE_BY_FORMAT = [
  { label: "OBJ", count: "890K", href: "/3d-models?format=obj" },
  { label: "FBX", count: "742K", href: "/3d-models?format=fbx" },
  { label: "3ds Max", count: "511K", href: "/3d-models?format=max" },
  { label: "STL", count: "398K", href: "/3d-models?format=stl" },
  { label: "Blender", count: "364K", href: "/3d-models?format=blend" },
  { label: "Cinema 4D", count: "221K", href: "/3d-models?format=c4d" },
  { label: "Maya", count: "187K", href: "/3d-models?format=ma" },
  { label: "glTF", count: "143K", href: "/3d-models?format=gltf" },
  { label: "Unreal Engine", count: "96K", href: "/3d-models?format=uasset" },
  { label: "Unity 3D", count: "88K", href: "/3d-models?format=unity" },
];

export const TRENDING_MODELS: ModelCard[] = [
  {
    slug: "roman-bust-scan",
    title: "Roman Marble Bust (Photogrammetry Scan)",
    author: "heritage3d",
    price: 45,
    rating: 4.9,
    reviews: 212,
    formats: ["OBJ", "FBX", "STL"],
    badge: "badgeTopRated",
    seed: "trend-1",
  },
  {
    slug: "stylized-hero-pack",
    title: "Stylized Hero Character Pack (Rigged)",
    author: "kamarabay",
    price: 119,
    rating: 4.8,
    reviews: 94,
    formats: ["BLEND", "FBX"],
    seed: "trend-2",
  },
  {
    slug: "ui-icon-megaset",
    title: "147 Asset Megaset (Modular Interiors)",
    author: "studio.nord",
    price: 210,
    rating: 5,
    reviews: 38,
    formats: ["MAX", "FBX", "OBJ"],
    badge: "badgeAssets",
    seed: "trend-3",
  },
  {
    slug: "classic-race-cars",
    title: "Classic Race Car Collection (50 Items)",
    author: "velocity.cg",
    price: 165,
    rating: 4.7,
    reviews: 156,
    formats: ["OBJ", "FBX", "C4D"],
    seed: "trend-4",
  },
  {
    slug: "orange-supercar",
    title: "Concept Supercar (Production Ready)",
    author: "velocity.cg",
    price: 89,
    rating: 4.9,
    reviews: 77,
    formats: ["BLEND", "FBX", "GLTF"],
    seed: "trend-5",
  },
  {
    slug: "anime-figure",
    title: "Anime Figure (Print Ready & Pre-supported)",
    author: "printforge",
    price: "free",
    rating: 4.6,
    reviews: 431,
    formats: ["STL", "3MF"],
    badge: "badgeFree",
    seed: "trend-6",
  },
  {
    slug: "gothic-cathedral",
    title: "Gothic Cathedral Interior (Modular Kit)",
    author: "studio.nord",
    price: 240,
    rating: 4.8,
    reviews: 62,
    formats: ["MAX", "OBJ"],
    seed: "trend-7",
  },
  {
    slug: "hong-kong-street",
    title: "Neon Street Environment (Hong Kong)",
    author: "atlas.works",
    price: 175,
    rating: 4.9,
    reviews: 118,
    formats: ["UNREAL", "FBX"],
    badge: "badgeEditors",
    seed: "trend-8",
  },
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
      { key: "models", href: "/3d-models" },
      { key: "printModels", href: "/3d-print-models" },
      { key: "textures", href: "/textures" },
      { key: "freeModels", href: "/3d-models/free" },
      { key: "collections", href: "/collections" },
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
