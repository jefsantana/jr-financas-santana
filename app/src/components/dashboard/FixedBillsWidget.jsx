import { Link } from 'react-router-dom';
import { FileText, PartyPopper } from 'lucide-react';
import { EmptyState, ProgressBar } from '../ui/index.js';
import { formatarMoeda } from '../../utils/formatadores.js';
import styles from './FixedBillsWidget.module.css';

// Soma das contas fixas do mês e andamento dos pagamentos. Recalcula sozinho:
// ao pagar (ou lançar na fatura) uma conta no Dashboard, os dados recarregam e
// o "Pago" sobe enquanto o "A pagar" desce.
export function FixedBillsWidget({ resumo }) {
  if (resumo.quantidade === 0) {
    return (
      <EmptyState
        icone={FileText}
        titulo="Nenhuma conta fixa"
        descricao="Cadastre aluguel, internet e assinaturas em Contas Fixas para somar aqui."
      />
    );
  }

  const tudoPago = resumo.quantidadePagas === resumo.quantidade;

  return (
    <div>
      <p className={styles.total}>
        {formatarMoeda(resumo.total)} <span>em {resumo.quantidade} contas fixas</span>
      </p>

      <ProgressBar percentual={resumo.percentual} cor={tudoPago ? 'sucesso' : 'primaria'} />
      <p className={styles.progresso}>
        {resumo.quantidadePagas} de {resumo.quantidade} pagas ({resumo.percentual}%)
      </p>

      <dl className={styles.linhas}>
        <div>
          <dt>Pago</dt>
          <dd className="valor-positivo">{formatarMoeda(resumo.valorPago)}</dd>
        </div>
        <div>
          <dt>A pagar</dt>
          <dd className={tudoPago ? 'valor-positivo' : 'valor-negativo'}>{formatarMoeda(resumo.valorPendente)}</dd>
        </div>
      </dl>

      {tudoPago ? (
        <p className={styles.nota}>
          <PartyPopper size={14} /> Todas as contas fixas do mês estão pagas.
        </p>
      ) : (
        <p className={styles.nota}>
          Falta pagar: {resumo.pendentes.map((c) => c.descricao).join(', ')}.{' '}
          <Link to="/contas">Ver contas fixas</Link>
        </p>
      )}
    </div>
  );
}
