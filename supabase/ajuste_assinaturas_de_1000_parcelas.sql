-- Ajuste de dados (rodar UMA vez, DEPOIS de migracao_assinaturas_e_pagar_fatura.sql)
-- Assinaturas que foram cadastradas como "parcelamento de 1000x" (ex: Claude,
-- Premier) viram Contas Fixas com cartão, e os parcelamentos falsos vão para a
-- Lixeira (dá para restaurar de lá). O valor mensal é o "valor_total" que já
-- estava cadastrado (era o preço mensal da assinatura).

insert into contas_fixas (familia_id, descricao, valor, dia_vencimento, categoria, cartao)
select p.familia_id, p.descricao, p.valor_total, coalesce(p.dia_vencimento, 1), p.categoria, p.cartao
  from parcelamentos p
 where p.numero_parcelas >= 1000
   and p.excluido_em is null
   and not exists (
     select 1 from contas_fixas c
      where c.familia_id = p.familia_id
        and lower(c.descricao) = lower(p.descricao)
        and c.excluido_em is null
   );

update parcelamentos
   set excluido_em = now(),
       excluido_por = 'Ajuste: virou conta fixa'
 where numero_parcelas >= 1000
   and excluido_em is null;
