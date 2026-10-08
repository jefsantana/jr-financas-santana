import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { EmptyState, ProgressBar } from '../ui/index.js';
import { formatarMoeda, formatarData } from '../../utils/formatadores.js';
import { nomeDoMes } from '../../utils/financeiro.js';
import styles from './CreditCardsWidget.module.css';

function dataIso(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

// Resumo dos cartões de crédito: fatura em aberto, quando vence e quanto do
// limite já está comprometido (fatura + parcelas futuras).
export function CreditCardsWidget({ resumos }) {
  if (resumos.length === 0) {
    return (
      <EmptyState
        icone={CreditCard}
        titulo="Nenhum cartão cadastrado"
        descricao="Cadastre um cartão em Cartões para acompanhar fatura e limite aqui."
      />
    );
  }

  const totalEmAberto = resumos.reduce((soma, r) => soma + r.emAberto, 0);

  return (
    <div>
      <p className={styles.total}>
        {formatarMoeda(totalEmAberto)} <span>em faturas abertas</span>
      </p>
      <ul className={styles.lista}>
        {resumos.map(({ cartao, emAberto, proximaFatura, uso }) => (
          <li key={cartao.id} className={styles.item}>
            <div className={styles.linha}>
              <Link to="/faturas" className={styles.nome}>
                <CreditCard size={14} /> {cartao.nome}
              </Link>
              <strong>{formatarMoeda(emAberto)}</strong>
            </div>
            <p className={styles.info}>
              {proximaFatura
                ? `Próxima fatura (${nomeDoMes(proximaFatura.mesFatura, 'short')}): ${formatarMoeda(proximaFatura.valor)} · vence ${formatarData(dataIso(proximaFatura.vencimento))}`
                : 'Nenhuma fatura em aberto'}
            </p>
            {uso.limite > 0 && (
              <>
                <ProgressBar percentual={uso.percentual} />
                <p className={styles.info}>
                  Limite usado {formatarMoeda(uso.usado)} de {formatarMoeda(uso.limite)} ·{' '}
                  <span className={uso.estourou ? 'valor-negativo' : undefined}>
                    {uso.estourou ? `estourou ${formatarMoeda(-uso.disponivel)}` : `${formatarMoeda(uso.disponivel)} livre`}
                  </span>
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
