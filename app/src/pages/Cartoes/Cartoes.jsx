import { CreditCard } from 'lucide-react';
import CrudPage from '../_shared/CrudPage.jsx';
import { AbasCartao } from '../../components/cartoes/AbasCartao.jsx';
import { ProgressBar } from '../../components/ui/index.js';
import { useCrudMock } from '../../hooks/useCrudMock.js';
import { formatarMoeda } from '../../utils/formatadores.js';
import { calcularUsoDoLimite } from '../../utils/financeiro.js';

export default function Cartoes() {
  const { registros: comprasCartao } = useCrudMock('ComprasCartao');
  const { registros: parcelamentos } = useCrudMock('Parcelamentos');

  const config = {
    tabela: 'Cartoes',
    icone: CreditCard,
    tituloForm: 'Novo Cartão',
    tituloLista: 'Cartões cadastrados',
    textoVazioLista: 'Cadastre o primeiro cartão usando o formulário acima.',
    dica: 'Compras à vista no cartão entram automaticamente na fatura (com base no dia de fechamento) e só viram gasto quando a fatura for paga, no Dashboard. Parcelas e assinaturas ligadas ao cartão também entram na fatura pelo botão "Lançar na fatura" do Dashboard. O limite usado considera a fatura em aberto mais as parcelas que ainda vão chegar.',
    validar: (dados) => {
      if (dados.diaFechamento === dados.diaVencimento) {
        return 'O dia de fechamento e o dia de vencimento da fatura não podem ser o mesmo.';
      }
      return null;
    },
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: Nubank' },
      { nome: 'limite', rotulo: 'Limite (R$)', tipo: 'moeda', obrigatorio: true },
      { nome: 'diaFechamento', rotulo: 'Dia de fechamento', tipo: 'numero', obrigatorio: true, min: 1, max: 31 },
      { nome: 'diaVencimento', rotulo: 'Dia de vencimento da fatura', tipo: 'numero', obrigatorio: true, min: 1, max: 31 },
    ],
    colunas: [
      { chave: 'nome', rotulo: 'Nome' },
      { chave: 'limite', rotulo: 'Limite', numerica: true, render: (r) => formatarMoeda(r.limite) },
      {
        chave: 'uso',
        rotulo: 'Limite usado',
        render: (r) => {
          const uso = calcularUsoDoLimite(r, comprasCartao, parcelamentos);
          return (
            <div style={{ minWidth: 150 }}>
              <p style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                {formatarMoeda(uso.usado)} usado ·{' '}
                <span className={uso.estourou ? 'valor-negativo' : undefined}>
                  {uso.estourou ? `estourou ${formatarMoeda(-uso.disponivel)}` : `${formatarMoeda(uso.disponivel)} livre`}
                </span>
              </p>
              <ProgressBar percentual={uso.percentual} />
            </div>
          );
        },
      },
      { chave: 'diaFechamento', rotulo: 'Fechamento', render: (r) => (r.diaFechamento ? `Dia ${r.diaFechamento}` : '-') },
      { chave: 'diaVencimento', rotulo: 'Vencimento', render: (r) => (r.diaVencimento ? `Dia ${r.diaVencimento}` : '-') },
    ],
  };

  return (
    <>
      <AbasCartao />
      <CrudPage config={config} />
    </>
  );
}
