import { Receipt, Layers, ShoppingBag } from 'lucide-react';
import { AbasCartao } from '../../components/cartoes/AbasCartao.jsx';
import { useState } from 'react';
import { Card, Badge, Button, ConfirmDialog, EmptyState, Loading, InfoBanner } from '../../components/ui/index.js';
import { usePagamentos } from '../../hooks/usePagamentos.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useCrudMock } from '../../hooks/useCrudMock.js';
import { formatarMoeda, nomeExibicao } from '../../utils/formatadores.js';
import { agruparComprasPorFatura, calcularUsoDoLimite, nomeDoMes } from '../../utils/financeiro.js';
import formStyles from '../_shared/CrudPage.module.css';
import styles from './Faturas.module.css';

export default function Faturas() {
  const { registros: cartoes, carregando: c1 } = useCrudMock('Cartoes');
  const { registros: comprasCartao, carregando: c2, recarregar: recarregarCompras } = useCrudMock('ComprasCartao');
  const { registros: parcelamentos, carregando: c3, recarregar: recarregarParcelamentos } = useCrudMock('Parcelamentos');
  const carregando = c1 || c2 || c3;
  const { perfil, usuario } = useAuth();
  const toast = useToast();
  const [paraPagar, setParaPagar] = useState(null);
  const { pagar, pagando } = usePagamentos(async () => {
    await Promise.all([recarregarCompras(), recarregarParcelamentos()]);
    toast.sucesso('Fatura paga: as compras viraram gasto no saldo');
  });

  if (carregando) return <Loading texto="Carregando faturas..." />;

  if (cartoes.length === 0) {
    return (
      <div>
        <AbasCartao />
        <EmptyState
          icone={Receipt}
          titulo="Nenhum cartão cadastrado"
          descricao="Cadastre um cartão na tela Cartões pra acompanhar as faturas aqui."
        />
      </div>
    );
  }

  return (
    <div>
      <AbasCartao />
      <div className={formStyles.cabecalhoPagina}>
        <Receipt size={20} className={formStyles.iconePagina} />
        <h1>Fatura do Cartão</h1>
      </div>

      <InfoBanner>
        Resumo de tudo que foi comprado no cartão de crédito, à vista ou parcelado, separado por fatura. Pague a fatura
        em aberto aqui ou nos "Próximos Vencimentos" do Dashboard: o valor sai do saldo só nesse momento. Assinaturas e
        parcelas entram na fatura quando você usa "Lançar na fatura" no Dashboard.
      </InfoBanner>

      {cartoes.map((cartao) => {
        const faturas = agruparComprasPorFatura(comprasCartao.filter((c) => c.cartao === cartao.nome));
        const uso = calcularUsoDoLimite(cartao, comprasCartao, parcelamentos);

        return (
          <section key={cartao.id} className={styles.secaoCartao}>
            <h3 className={styles.tituloCartao}>{cartao.nome}</h3>
            {uso.limite > 0 && (
              <p className={styles.semCompras}>
                Limite {formatarMoeda(uso.limite)} · usado {formatarMoeda(uso.usado)} ({formatarMoeda(uso.emFatura)} em
                fatura + {formatarMoeda(uso.parcelasFuturas)} em parcelas futuras) ·{' '}
                {uso.estourou ? `estourou ${formatarMoeda(-uso.disponivel)}` : `${formatarMoeda(uso.disponivel)} livre`}
              </p>
            )}

            {faturas.length === 0 ? (
              <p className={styles.semCompras}>Nenhuma compra registrada neste cartão ainda.</p>
            ) : (
              <div className={styles.listaFaturas}>
                {faturas.map((fatura) => (
                  <Card key={fatura.mesFatura} className={styles.cardFatura}>
                    <div className={styles.linhaTopoFatura}>
                      <span className={styles.mesFatura}>{nomeDoMes(fatura.mesFatura, 'long')}</span>
                      <Badge cor={fatura.paga ? 'sucesso' : 'alerta'}>{fatura.paga ? 'Paga' : 'Em aberto'}</Badge>
                    </div>

                    <p className={styles.totalFatura}>{formatarMoeda(fatura.valorTotal)}</p>

                    {!fatura.paga && (
                      <Button
                        tamanho="pequeno"
                        carregando={pagando === `${cartao.nome}__${fatura.mesFatura}`}
                        onClick={() => setParaPagar({ cartao: cartao.nome, mesFatura: fatura.mesFatura, valor: fatura.valorAberto })}
                      >
                        Pagar fatura ({formatarMoeda(fatura.valorAberto)})
                      </Button>
                    )}

                    <p className={styles.resumoTipos}>
                      {fatura.totalAVista > 0 && `${formatarMoeda(fatura.totalAVista)} à vista`}
                      {fatura.totalAVista > 0 && fatura.totalParcelado > 0 && ' · '}
                      {fatura.totalParcelado > 0 && `${formatarMoeda(fatura.totalParcelado)} parcelado`}
                    </p>

                    <ul className={styles.itensFatura}>
                      {fatura.itens.map((item) => {
                        const IconeItem = item.parcelado ? Layers : ShoppingBag;
                        return (
                          <li key={item.id}>
                            <span className={styles.descricaoItem}>
                              <IconeItem size={13} /> {item.descricao}
                            </span>
                            <span>{formatarMoeda(item.valor)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <ConfirmDialog
        aberto={Boolean(paraPagar)}
        aoFechar={() => setParaPagar(null)}
        aoConfirmar={() =>
          pagar(
            {
              tipo: 'fatura',
              id: `${paraPagar.cartao}__${paraPagar.mesFatura}`,
              cartao: paraPagar.cartao,
              mesFatura: paraPagar.mesFatura,
            },
            nomeExibicao(perfil, usuario).split(' ')[0]
          )
        }
        titulo="Pagar fatura"
        mensagem={
          paraPagar
            ? `Confirma o pagamento da fatura de ${nomeDoMes(paraPagar.mesFatura, 'long')} do ${paraPagar.cartao}, no valor de ${formatarMoeda(paraPagar.valor)}? Isso vai debitar o valor do saldo.`
            : ''
        }
        textoConfirmar="Pagar fatura"
        variantePerigo={false}
      />
    </div>
  );
}
