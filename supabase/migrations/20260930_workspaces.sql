-- Execute no SQL Editor do projeto Supabase usado pelo MeuRepertório.
-- Cria o documento privado por usuário sem alterar as tabelas de músicas existentes.
create table if not exists public.workspaces (
  user_id text primary key,
  document jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
revoke all on table public.workspaces from anon, authenticated;
grant usage on schema public to service_role;
grant all on table public.workspaces to service_role;
notify pgrst, 'reload schema';
