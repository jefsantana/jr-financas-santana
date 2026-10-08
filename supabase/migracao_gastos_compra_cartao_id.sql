-- Migração: vínculo entre o Gasto gerado ao pagar a fatura e a compra do cartão
-- (já aplicada no projeto principal; mantida aqui como histórico/idempotente).
--
-- Por quê: os relatórios e o Dashboard passam a contar compras de cartão pela
-- DATA DA COMPRA (regime de competência). O Gasto criado ao pagar a fatura é
-- só a saída de caixa daquela mesma compra — com este vínculo ele não é
-- contado de novo nas categorias/orçamentos.

alter table gastos add column if not exists compra_cartao_id uuid references compras_cartao(id) on delete set null;

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
    returning id, familia_id, descricao, valor, categoria, cartao, pessoa
  )
  insert into gastos (familia_id, descricao, valor, data, categoria, cartao, pessoa, compra_cartao_id)
  select familia_id,
         descricao,
         valor,
         (now() at time zone 'America/Sao_Paulo')::date,
         coalesce(categoria, 'Cartão de Crédito'),
         cartao,
         coalesce(pessoa, p_pessoa),
         id
    from pagas;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

grant execute on function public.pagar_fatura(text, text, text) to authenticated;
