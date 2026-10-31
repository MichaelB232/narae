-- Skema untuk adapter Supabase / Postgres
create table events(id text primary key, at timestamptz, type text, detail text);
create table help_requests(id text primary key, at timestamptz, device text, status text);
-- HANYA UNTUK HACKATHON: akses terbuka. Ganti dengan policy berbasis auth sebelum produksi.
alter table events enable row level security;
alter table help_requests enable row level security;
create policy "open events" on events for all using (true) with check (true);
create policy "open help" on help_requests for all using (true) with check (true);
