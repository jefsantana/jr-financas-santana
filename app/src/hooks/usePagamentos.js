import { useCallback, useState } from 'react';
import { criar, atualizar, listar, pagarFatura } from '../services/dados.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { dataLocalDeHoje } from '../utils/formatadores.js';
import { dataDaCobranca } from '../utils/financeiro.js';
import { criarCompraNoCartao } from '../utils/comprasCartao.js';

export function usePagamentos(aoConcluir) {
  const { perfil } = useAuth();
  const toast = useToast();
  const [pagando, setPagando] = useState(null);

  const pagar = useCallback(
    async (item, pessoa) => {
      const familiaId = perfil?.familia_id;
      setPagando(item.id);
      try {
        if (item.tipo === 'fatura') {
          // Pagar a fatura roda numa única transação no banco: cada compra
          // pendente vira Gasto (com a pessoa que fez a compra) e é marcada
          // como paga — ou tudo acontece, ou nada.
          await pagarFatura(item.cartao, item.mesFatura, pessoa);
        } else if (item.cartao) {
          // Assinatura (conta fixa) ou parcela cobrada num cartão: não sai do
          // saldo agora, entra pendente na fatura do cartão — igual a
          // qualquer outra compra no crédito. O dinheiro só sai do saldo
          // quando a fatura for paga.
          const cartoes = await listar('Cartoes');
          const ehParcela = item.tipo === 'parcelamento';
          await criarCompraNoCartao({
            descricao: ehParcela ? `${item.descricaoBase} (${item.parcelaAtual}/${item.numeroParcelas})` : item.descricao,
            valor: item.valor,
            data: dataDaCobranca(item.mesAno, item.diaVencimento),
            categoria: item.categoria || 'Cartão de Crédito',
            cartao: item.cartao,
            pessoa,
            familiaId,
            cartoes,
          });
          await registrarBaixa(item, pessoa, familiaId);
        } else {
          await registrarBaixa(item, pessoa, familiaId);
          await criar(
            'Gastos',
            {
              descricao: item.descricao,
              valor: item.valor,
              data: dataLocalDeHoje(),
              categoria: item.categoria || 'Cartão de Crédito',
              cartao: '',
              pessoa,
            },
            familiaId
          );
        }

        await aoConcluir?.();
      } catch {
        toast.erro('Não foi possível registrar o pagamento. Tente novamente.');
      } finally {
        setPagando(null);
      }
    },
    [aoConcluir, perfil?.familia_id, toast]
  );

  return { pagar, pagando };
}

// Marca a conta fixa / parcela como resolvida neste mês (some dos
// "Próximos Vencimentos") e, no caso de parcela, avança a parcela atual.
async function registrarBaixa(item, pessoa, familiaId) {
  if (item.tipo === 'contaFixa') {
    await criar('PagamentosContasFixas', { contaFixaId: item.id, mesAno: item.mesAno, pessoa }, familiaId);
  } else {
    await criar('PagamentosParcelamentos', { parcelamentoId: item.id, mesAno: item.mesAno, pessoa }, familiaId);
    await atualizar('Parcelamentos', item.id, { parcelaAtual: item.parcelaAtual + 1 });
  }
}
