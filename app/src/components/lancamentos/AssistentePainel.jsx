import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ChatAssistente } from './ChatAssistente.jsx';
import styles from './AssistentePainel.module.css';

// Painel fixo ao lado: não bloqueia o dashboard. Fica sempre montado (só
// escondido) para a conversa não ser perdida ao fechar/reabrir.
export function AssistentePainel({ aberto, aoFechar, aoAbrirManual }) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') aoFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, aoFechar]);

  return (
    <aside
      className={`${styles.painel} ${aberto ? styles.painelAberto : ''}`}
      aria-label="Assistente Santana"
      aria-hidden={!aberto}
      inert={!aberto}
    >
      <div className={styles.cabecalho}>
        <h3 className={styles.titulo}>Assistente Santana</h3>
        <button type="button" className={styles.botaoFechar} onClick={aoFechar} aria-label="Fechar assistente">
          <X size={18} />
        </button>
      </div>
      <div className={styles.corpo}>
        <ChatAssistente aoAbrirManual={aoAbrirManual} />
      </div>
    </aside>
  );
}
