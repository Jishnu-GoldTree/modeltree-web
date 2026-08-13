/**
 * Static content for the MODELTREE landing page.
 * Everything here is placeholder copy/figures standing in for what will later
 * come from the catalog service. Keeping it in one module means the section
 * components stay presentational and swap over to real data in one place.
 */

export type CategoryTile = {
  slug: string;
  label: string;
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
  children?: { label: string; href: string; description?: string }[];
};

export const SITE = {
  name: "MODELTREE",
  // Jewellery-first, because that is the business: GoldTree is a gold trading
  // company with an in-house library of 40,000 jewellery models built by four
  // designers over two years. Claims here must stay defensible — the earlier
  // "world's largest" was invented placeholder and had to go.
  tagline: "40,000 jewellery models, cast-ready and yours to license",
  description:
    "A jewellery-first 3D marketplace from GoldTree. Rings, pendants and settings modelled in-house for casting and print — plus a wider catalog of production-ready assets, or commission exactly what you need.",
} as const;

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "3D Models",
    href: "/3d-models",
    children: [
      {
        label: "All 3D models",
        href: "/3d-models",
        description: "Browse the full catalog",
      },
      {
        label: "Free 3D models",
        href: "/3d-models/free",
        description: "Zero-cost assets with commercial licensing",
      },
      {
        label: "PBR textures",
        href: "/textures",
        description: "Scanned and procedural material libraries",
      },
      {
        label: "Rigged & animated",
        href: "/3d-models/rigged",
        description: "Production-ready characters and creatures",
      },
      {
        label: "Low poly",
        href: "/3d-models/low-poly",
        description: "Game-optimized meshes under 10k triangles",
      },
      {
        label: "Scanned models",
        href: "/3d-models/scanned",
        description: "Photogrammetry captures of real-world objects",
      },
    ],
  },
  {
    label: "3D Printing",
    href: "/3d-print-models",
    children: [
      {
        label: "Print-ready models",
        href: "/3d-print-models",
        description: "Watertight STL and 3MF files, ready to slice",
      },
      {
        label: "Free STL files",
        href: "/3d-print-models/free",
        description: "Community-shared prints at no cost",
      },
      {
        label: "Miniatures & tabletop",
        href: "/3d-print-models/miniatures",
        description: "Supported and pre-supported minis",
      },
      {
        label: "Functional parts",
        href: "/3d-print-models/functional",
        description: "Brackets, jigs, enclosures and spares",
      },
    ],
  },
  {
    label: "Custom 3D",
    href: "/custom-work",
    children: [
      {
        label: "Modelry",
        href: "/custom-work/modelry",
        description: "Full-service 3D model creation, managed end to end",
      },
      {
        label: "3D Projects",
        href: "/custom-work/projects",
        description: "Post a brief and hire a designer directly",
      },
      {
        label: "Enterprise solutions",
        href: "/business",
        description: "Team seats, invoicing and extended licensing",
      },
    ],
  },
  {
    label: "For Designers",
    href: "/designers",
    children: [
      {
        label: "Start selling",
        href: "/sell",
        description: "Upload your models and earn on every sale",
      },
      {
        label: "Designer dashboard",
        href: "/dashboard",
        description: "Track sales, payouts and buyer messages",
      },
      {
        label: "Publishing guidelines",
        href: "/guidelines",
        description: "Quality bar, licensing and file requirements",
      },
    ],
  },
];

export const HERO_FILTERS = [
  { label: "Trending", href: "/3d-models?sort=trending" },
  { label: "Blender", href: "/3d-models?software=blender" },
  { label: "PBR textures", href: "/textures" },
  { label: "Rigged", href: "/3d-models?rigged=1" },
  { label: "Animated", href: "/3d-models?animated=1" },
  { label: "Free models", href: "/3d-models/free" },
  { label: "Low poly", href: "/3d-models/low-poly" },
];

export const ASSET_TABS = [
  "Trending",
  "Business",
  "Delivery robot",
  "Cinema",
  "House exterior",
  "Comic book",
  "Store",
  "Restaurant",
];

export const ASSET_CATEGORIES: CategoryTile[] = [
  { slug: "exterior", label: "Exterior", count: "128K", seed: "exterior-a" },
  { slug: "car", label: "Car", count: "94K", seed: "car-b" },
  { slug: "aircraft", label: "Aircraft", count: "31K", seed: "aircraft-c" },
  { slug: "furniture", label: "Furniture", count: "212K", seed: "furniture-d" },
  { slug: "military", label: "Military", count: "48K", seed: "military-e" },
  { slug: "character", label: "Character", count: "76K", seed: "character-f" },
  { slug: "animal", label: "Animal", count: "39K", seed: "animal-g" },
  { slug: "plant", label: "Plant", count: "57K", seed: "plant-h" },
  { slug: "food", label: "Food", count: "44K", seed: "food-i" },
];

export const PRINT_TABS = [
  "Trending",
  "D&D tools",
  "Jewelry mold",
  "Europe",
  "Cars",
  "Batteries",
  "Anime",
  "Vintage",
  "Toy holders",
];

export const PRINT_CATEGORIES: CategoryTile[] = [
  { slug: "art", label: "Art", count: "62K", seed: "art-j" },
  { slug: "games-toys", label: "Games & Toys", count: "88K", seed: "games-k" },
  { slug: "jewelry", label: "Jewelry", count: "27K", seed: "jewelry-l" },
  { slug: "miniatures", label: "Miniatures", count: "103K", seed: "mini-m" },
  { slug: "hobby-diy", label: "Hobby & DIY", count: "45K", seed: "hobby-n" },
  { slug: "fashion", label: "Fashion", count: "19K", seed: "fashion-o" },
  { slug: "buildings", label: "Buildings", count: "34K", seed: "build-p" },
  { slug: "house", label: "House", count: "51K", seed: "house-q" },
  { slug: "tools", label: "Tools & Organizers", count: "72K", seed: "tools-r" },
];

export const COLLECTIONS = [
  {
    slug: "3d-model-collections",
    kicker: "Discover Curated 3D Model Collections",
    blurb:
      "Explore curated collections of 3D models hand-picked for fast discovery and better landing pages.",
    featured: {
      title: "Rigged 3D Characters for Games",
      description:
        "A curated selection of rigged 3D character models designed for use in games. These assets support different rig types and standard skeletons, so they drop straight into your engine.",
      cta: "Go to collection",
      seed: "collection-characters",
    },
  },
  {
    slug: "3d-print-collections",
    kicker: "Discover Curated 3D Print Collections",
    blurb:
      "Targeted collections of 3D print-ready models to support campaigns and seasonal promos.",
    featured: {
      title: "RC & Model Car Parts",
      description:
        "Browse designs and parts applied for cars, print-ready wheels, body shells, chassis components and custom upgrades.",
      cta: "Go to collection",
      seed: "collection-cars",
    },
  },
] as const;

export const FEATURED_DESIGNER = {
  name: "kamarabay.com",
  handle: "@kamarabay",
  rating: 4.9,
  reviews: 1284,
  models: 312,
  since: "2019",
  bio: "Character and creature specialists producing game-ready, fully rigged assets with consistent topology and PBR texture sets.",
  tags: ["Characters", "Rigged", "Game-ready", "PBR"],
  works: [
    { seed: "kam-1", title: "Sci-fi Squad Pack", price: 149 },
    { seed: "kam-2", title: "Medieval Villagers", price: 89 },
    { seed: "kam-3", title: "Stylized Heroes Vol. 2", price: 119 },
    { seed: "kam-4", title: "Creature Anatomy Kit", price: 199 },
  ],
};

export const BROWSE_BY_TYPE = [
  { label: "Animated", count: "84K", href: "/3d-models?animated=1" },
  { label: "Rigged", count: "61K", href: "/3d-models?rigged=1" },
  { label: "PBR", count: "156K", href: "/3d-models?pbr=1" },
  { label: "Low poly", count: "203K", href: "/3d-models/low-poly" },
  { label: "3D print models", count: "412K", href: "/3d-print-models" },
  { label: "Textures", count: "77K", href: "/textures" },
  { label: "PBR Textures", count: "52K", href: "/textures?pbr=1" },
  { label: "Scripts & Plugins", count: "3.1K", href: "/scripts" },
  { label: "Scanned", count: "12K", href: "/3d-models/scanned" },
  { label: "VR models", count: "29K", href: "/3d-models?vr=1" },
];

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
    title: "Roman Marble Bust — Photogrammetry Scan",
    author: "heritage3d",
    price: 45,
    rating: 4.9,
    reviews: 212,
    formats: ["OBJ", "FBX", "STL"],
    badge: "Top rated",
    seed: "trend-1",
  },
  {
    slug: "stylized-hero-pack",
    title: "Stylized Hero Character Pack — Rigged",
    author: "kamarabay",
    price: 119,
    rating: 4.8,
    reviews: 94,
    formats: ["BLEND", "FBX"],
    seed: "trend-2",
  },
  {
    slug: "ui-icon-megaset",
    title: "147 Asset Megaset — Modular Interiors",
    author: "studio.nord",
    price: 210,
    rating: 5,
    reviews: 38,
    formats: ["MAX", "FBX", "OBJ"],
    badge: "147 assets",
    seed: "trend-3",
  },
  {
    slug: "classic-race-cars",
    title: "Classic Race Car Collection — 50 Items",
    author: "velocity.cg",
    price: 165,
    rating: 4.7,
    reviews: 156,
    formats: ["OBJ", "FBX", "C4D"],
    seed: "trend-4",
  },
  {
    slug: "orange-supercar",
    title: "Concept Supercar — Production Ready",
    author: "velocity.cg",
    price: 89,
    rating: 4.9,
    reviews: 77,
    formats: ["BLEND", "FBX", "GLTF"],
    seed: "trend-5",
  },
  {
    slug: "anime-figure",
    title: "Anime Figure — Print Ready & Pre-supported",
    author: "printforge",
    price: "free",
    rating: 4.6,
    reviews: 431,
    formats: ["STL", "3MF"],
    badge: "Free",
    seed: "trend-6",
  },
  {
    slug: "gothic-cathedral",
    title: "Gothic Cathedral Interior — Modular Kit",
    author: "studio.nord",
    price: 240,
    rating: 4.8,
    reviews: 62,
    formats: ["MAX", "OBJ"],
    seed: "trend-7",
  },
  {
    slug: "hong-kong-street",
    title: "Neon Street Environment — Hong Kong",
    author: "atlas.works",
    price: 175,
    rating: 4.9,
    reviews: 118,
    formats: ["UNREAL", "FBX"],
    badge: "Editor's pick",
    seed: "trend-8",
  },
];

export const VALUE_PROPS = [
  {
    title: "Production-ready 3D models, ready to license",
    body: "MODELTREE is the leading 3D model marketplace, a hub for using and contributing to the world of 3D design. Whether you're seeking assets for your projects or offering your own creations, MODELTREE provides the platform and community to make it happen.",
    icon: "layers",
  },
  {
    title: "The best prices on the market",
    body: "We're dedicated to providing outstanding value, ensuring you can access the resources you need to fuel your creative projects without overspending. Discover the MODELTREE advantage and unlock a world of affordable 3D models.",
    icon: "tag",
  },
  {
    title: "Curated Quality Standard",
    body: "No more guesswork. The Quality Standard highlights key technical characteristics of 786 files, including PBR textures, making it easier and faster to find the right models.",
    icon: "badge-check",
  },
] as const;

export const CUSTOM_SOLUTIONS = [
  {
    key: "modelry",
    name: "Modelry",
    subtitle: "Full-service 3D model creation",
    cta: "Get a quote",
    steps: [
      {
        title: "Upload images",
        body: "Send us reference images or product links — no technical expertise needed.",
      },
      {
        title: "3D Model Creation",
        body: "We handle modeling, asset production, designer selection and in-house quality assurance.",
      },
      {
        title: "Approve and Use",
        body: "Review and accept the final 3D model and images, ready for publishing.",
      },
    ],
    benefits: [
      "End-to-end service — no vendor juggling",
      "Consistent quality across every batch",
      "Fixed pricing, no hourly surprises",
      "Scalable production for thousands of SKUs",
    ],
  },
  {
    key: "projects",
    name: "3D Projects",
    subtitle: "Work directly with a designer",
    cta: "Post a Project",
    steps: [
      {
        title: "Create a Listing",
        body: "Describe your project with requirements, budget and timeline.",
      },
      {
        title: "Select a Designer",
        body: "Browse designers who applied for your job, compare their portfolios and offered prices, then choose who to work with.",
      },
      {
        title: "Get Your Model",
        body: "Collaborate directly with the designer to finalize your 3D model.",
      },
    ],
    benefits: [
      "Direct collaboration — talk to the designer",
      "Flexible iterations — adjust designs as the brief evolves",
      "Best-fit creative projects — ideal for custom or one-off work",
    ],
  },
] as const;

export const BUSINESS_PERKS = [
  {
    title: "Easy Asset Sharing Across Teams",
    body: "Share 3D models with your team without the usual hassle. Store an asset once and it's available to everyone who needs it, with no duplicate purchases.",
    icon: "users",
  },
  {
    title: "Streamlined Payments",
    body: "Make 3D asset purchases simpler with flexible billing options. Consolidate invoicing and stop chasing receipts, whether it's one purchase or a hundred.",
    icon: "credit-card",
  },
  {
    title: "Clear Licensing Terms",
    body: "We offer a range of flexible licensing options to suit your needs. Whether you need a simple license for personal use or a more comprehensive one for commercial projects, we have you covered.",
    icon: "file-check",
  },
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
    heading: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Marketplace",
    links: [
      { label: "3D models", href: "/3d-models" },
      { label: "3D print models", href: "/3d-print-models" },
      { label: "Textures", href: "/textures" },
      { label: "Free models", href: "/3d-models/free" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    heading: "For designers",
    links: [
      { label: "Start selling", href: "/sell" },
      { label: "Royalty rates", href: "/sell/royalties" },
      { label: "Publishing guidelines", href: "/guidelines" },
      { label: "Designer forum", href: "/forum" },
      { label: "Challenges", href: "/challenges" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Licensing", href: "/licensing" },
      { label: "Refund policy", href: "/refunds" },
      { label: "Report content", href: "/report" },
      { label: "System status", href: "/status" },
    ],
  },
] as const;
