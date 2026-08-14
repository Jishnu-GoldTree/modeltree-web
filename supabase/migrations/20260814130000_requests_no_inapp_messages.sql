-- Drops the in-app message thread.
--
-- The conversation happens on WhatsApp, which is where Israeli jewelers
-- already are and where GoldTree's modelers can answer from a phone they
-- already carry. What stays in the database is the part that becomes an order:
-- the request, the brief, the quote and the status.
--
-- The table is dropped rather than left empty: a table nobody writes to reads
-- as a half-finished feature to the next person, and re-adding it is one
-- migration if in-app messaging ever earns its place.

begin;

drop table if exists public.request_messages;

commit;
