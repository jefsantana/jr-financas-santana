-- Migração: histórico de conversa do bot (persistente)
-- Rode este script inteiro no SQL Editor do Supabase (uma vez só).
--
-- Por quê: o bot já guardava as últimas mensagens de cada pessoa em memória
-- (RAM), só pra IA entender o contexto de uma conversa em andamento. O
-- problema é que o bot roda em modelo de "polling" (conecta, processa,
-- desconecta) e reinicia/reconecta com frequência — cada vez que isso
-- acontece, a memória em RAM some e o bot "esquece" a conversa. Esta tabela
-- guarda essas mesmas mensagens no banco, então a conversa sobrevive a
-- reinícios (igual já acontece com "bot_pendencias").

create table if not exists bot_historico_conversa (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id),
  jid text not null,
  papel text not null check (papel in ('usuario', 'bot')),
  texto text not null,
  criado_em timestamptz not null default now()
);

-- Acelera a busca "últimas mensagens desta pessoa, mais recentes primeiro",
-- que é a única consulta feita nesta tabela.
create index if not exists idx_bot_historico_conversa_jid
  on bot_historico_conversa (familia_id, jid, criado_em desc);

alter table bot_historico_conversa enable row level security;
-- Sem policies: só o bot acessa esta tabela, usando a service key (que
-- ignora RLS) — ninguém logado pela tela do site precisa ler isso.
