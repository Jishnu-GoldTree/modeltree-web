/**
 * Checkout: the bookkeeping an order needs to be reconciled against a payment
 * provider (PayPlus in production, a mock everywhere a merchant account isn't
 * configured).
 *
 * The flow this supports:
 *   1. the storefront inserts a `pending` order with its line snapshots,
 *   2. asks the provider for a hosted payment page and stores its request uid,
 *   3. flips the order to `paid` only after the provider confirms the charge
 *      server-to-server — never on the strength of a browser redirect alone.
 *
 * `model_files_read` already admits a buyer the moment their order is `paid`,
 * so nothing about entitlement changes here; this only records how an order
 * got there.
 *
 * Writes stay service-role only. RLS on `orders` has no insert or update
 * policy and this migration deliberately adds none.
 */

-- Shekels are what is charged. The 'USD' default predates the Israel-first
-- pricing decision and every order this flow creates sets ILS explicitly; the
-- default changes so a forgotten column can't mislabel a charge.
alter table public.orders
  alter column currency set default 'ILS';

alter table public.orders
  add column if not exists provider                 text,
  -- The provider's id for the hosted payment page. Unique: one page, one order.
  add column if not exists provider_request_uid     text unique,
  -- The provider's id for the captured charge. Unique so a replayed callback
  -- can't attach the same charge to a second order.
  add column if not exists provider_transaction_uid text unique,
  -- Snapshot of where the receipt went; the account email can change later.
  add column if not exists buyer_email              text,
  add column if not exists paid_at                  timestamptz,
  -- The provider's verification response, verbatim, for disputes and support.
  add column if not exists provider_payload         jsonb;

alter table public.orders
  drop constraint if exists orders_provider_check;
alter table public.orders
  add constraint orders_provider_check
  check (provider is null or provider in ('payplus', 'mock', 'free'));

-- A paid order must say when, and must be traceable to something.
alter table public.orders
  drop constraint if exists orders_paid_has_timestamp;
alter table public.orders
  add constraint orders_paid_has_timestamp
  check (status <> 'paid' or paid_at is not null or provider is null);

create index if not exists orders_status_placed_idx
  on public.orders (status, placed_at desc);
