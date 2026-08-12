import { getModel, type CatalogModel, type License } from "@/lib/data/catalog";

/**
 * Demo accounts.
 *
 * Stands in for the user table until there's a database. Passwords are stored
 * in plain text here because these are fixtures, not accounts — the moment a
 * real user store exists this module goes away and passwords get hashed. The
 * credentials provider that reads this is gated so it can't ship to production
 * by accident; see `src/auth.ts`.
 */

export type DemoUser = {
  id: string;
  name: string;
  handle: string;
  email: string;
  password: string;
  accountType: "buyer" | "designer";
  memberSince: string;
  location: string;
  bio: string;
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: "u_alex",
    name: "Omri GoldTree",
    handle: "alexrivera",
    email: "omri@goldtree.com",
    password: "demo1234",
    accountType: "buyer",
    memberSince: "March 2024",
    location: "Lisbon, Portugal",
    bio: "Art director sourcing assets for product visualisation and short-form film.",
  },
  {
    id: "u_kamara",
    name: "Kamara Bay",
    handle: "kamarabay",
    email: "designer@modeltree.demo",
    password: "demo1234",
    accountType: "designer",
    memberSince: "August 2019",
    location: "Nairobi, Kenya",
    bio: "Character and creature specialist producing game-ready, fully rigged assets with consistent topology and PBR texture sets.",
  },
];

export function findDemoUser(email: string, password: string) {
  return DEMO_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.trim().toLowerCase() &&
      user.password === password,
  );
}

export function getDemoUserByEmail(email?: string | null) {
  if (!email) return undefined;
  return DEMO_USERS.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );
}

/* ------------------------------------------------------------ account data */

export type Order = {
  id: string;
  placedOn: string;
  model: CatalogModel;
  license: License;
  total: number;
};

/** Slugs are stable across builds, so these orders always resolve. */
const ORDER_FIXTURES: Record<
  string,
  { slug: string; id: string; placedOn: string }[]
> = {
  u_alex: [
    { id: "MT-40912", slug: "furniture-lounge-chair", placedOn: "12 Jul 2026" },
    { id: "MT-40488", slug: "car-sports-coupe", placedOn: "28 Jun 2026" },
    { id: "MT-39774", slug: "plant-fern-cluster", placedOn: "03 Jun 2026" },
    { id: "MT-38210", slug: "exterior-modern-villa", placedOn: "19 Apr 2026" },
  ],
  u_kamara: [
    { id: "MT-41003", slug: "military-field-radio", placedOn: "02 Aug 2026" },
    { id: "MT-40120", slug: "aircraft-bush-plane", placedOn: "15 Jun 2026" },
  ],
};

/** Fixtures name models by slug; anything the generator no longer emits is skipped. */
export function getOrders(userId: string): Order[] {
  return (ORDER_FIXTURES[userId] ?? [])
    .map((fixture) => {
      const model = getModel(fixture.slug);
      if (!model) return null;
      return {
        id: fixture.id,
        placedOn: fixture.placedOn,
        model,
        license: model.license,
        total: model.price === "free" ? 0 : model.price,
      };
    })
    .filter((order): order is Order => order !== null);
}

export function getAccountStats(userId: string) {
  const orders = getOrders(userId);
  return {
    purchases: orders.length,
    spent: orders.reduce((sum, order) => sum + order.total, 0),
    downloads: orders.reduce(
      (sum, order) => sum + order.model.formats.length,
      0,
    ),
  };
}

/** Designer-only figures, shown on the seller side of the profile. */
export function getDesignerStats(handle: string) {
  return {
    published: 312,
    sales: 4_186,
    followers: 1_284,
    rating: 4.9,
    handle,
  };
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
