-- Chatbot conversation log. One row per chat session, updated as the
-- conversation grows. Stores the full message history as JSONB so we can
-- replay flows when debugging or train follow-up models on real questions.
--
-- Apply via: supabase db push  (or run the SQL directly in the dashboard)

create table if not exists public.chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  messages jsonb not null default '[]'::jsonb,
  message_count int not null default 0,
  escalated_to_whatsapp boolean not null default false,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chatbot_conversations_session_id_idx
  on public.chatbot_conversations (session_id);

create index if not exists chatbot_conversations_created_at_idx
  on public.chatbot_conversations (created_at desc);

-- Auto-update `updated_at` on every UPDATE.
create or replace function public.touch_chatbot_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chatbot_conversations_touch on public.chatbot_conversations;
create trigger chatbot_conversations_touch
  before update on public.chatbot_conversations
  for each row execute function public.touch_chatbot_conversation_updated_at();

-- Lock the table. Only the service role (used server-side by the API
-- route) may read/write. Anonymous visitors never touch this table
-- directly — the /api/chat handler is the sole writer.
alter table public.chatbot_conversations enable row level security;

-- Service role bypasses RLS by definition, so no policies for anon/authenticated.
-- (Leaving the table policy-empty means anon gets 0 rows. Exactly what we want.)
