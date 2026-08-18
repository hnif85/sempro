-- =============================================
-- SEMP — 011_public_event_checkout
-- Public event registration + individual payment ownership
-- Idempotent: aman dijalankan berulang
-- =============================================

alter table public.invoices
  alter column club_id drop not null;

alter table public.invoices
  add column if not exists payer_user_id uuid references public.profiles(id) on delete set null;

create index if not exists invoices_payer_user_id_idx
  on public.invoices (payer_user_id);
