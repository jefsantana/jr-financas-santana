-- Migração: assinaturas no cartão + pagamento de fatura atômico
-- Rode este script inteiro no SQL Editor do Supabase (pode rodar mais de uma vez).

-- 1) Conta fixa / assinatura pode ser cobrada num cartão de crédito.
--    Quando tem cartão, "Pagar" no Dashboard lança a cobrança na fatura
--    do cartão (e não debita o saldo na hora).
alter table contas_fixas add column if not exists cartao text;

-- 2) Pagar uma fatura = transformar TODAS as compras pendentes dela em
--    Gastos e marcar como pagas, numa única transação (tudo ou nada).
--    Mantém a pessoa que fez cada compra (não quem clicou em pagar).
--    SECURITY INVOKER: as políticas RLS da família continuam valendo.
create or replace function public.pagar_fatura(
  p_cartao text,
  p_mes_fatura text,
  p_pessoa text default null
) returns integer
language plpgsql
security invoker
as $$
declare
  v_qtd integer;
begin
  with pagas as (
    update compras_cartao
       set paga = true
     where familia_id = public.minha_familia()
       and cartao = p_cartao
       and mes_fatura = p_mes_fatura
       and paga = false
       and excluido_em is null
    returning familia_id, descricao, valor, categoria, cartao, pessoa
  )
  insert into gastos (familia_id, descricao, valor, data, categoria, cartao, pessoa)
  select familia_id,
         descricao,
         valor,
         (now() at time zone 'America/Sao_Paulo')::date,
         coalesce(categoria, 'Cartão de Crédito'),
         cartao,
         coalesce(pessoa, p_pessoa)
    from pagas;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

grant execute on function public.pagar_fatura(text, text, text) to authenticated;
