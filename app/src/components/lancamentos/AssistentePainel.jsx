import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, X } from 'lucide-react';
import { ChatAssistente } from './ChatAssistente.jsx';
import styles from './AssistentePainel.module.css';

// Painel fixo ao lado: não bloqueia o dashboard. Fica sempre montado (só
// escondido) para a conversa não ser perdida ao fechar/reabrir.
export function AssistentePainel({ aberto, aoFechar, aoAbrirManual }) {
  const [minimizado, setMinimizado] = useState(false);
  const painelRef = useRef(null);

  // iPhone: o teclado NAO diminui a pagina (diferente do Android), ele fica por
  // cima - e o popup, que e fixo embaixo, ficava escondido atras dele. Acompanha
  // a area realmente visivel (visualViewport) pra subir junto com o teclado.
  useEffect(() => {
    const vv = window.visualViewport;
    const painel = painelRef.current;
    if (!aberto || !vv || !painel) return;
    const ajustar = () => {
      const teclado = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      painel.style.setProperty('--teclado', `${teclado}px`);
      painel.style.setProperty('--altura-visivel', `${vv.height}px`);
    };
    ajustar();
    vv.addEventListener('resize', ajustar);
    vv.addEventListener('scroll', ajustar);
    return () => {
      vv.removeEventListener('resize', ajustar);
      vv.removeEventListener('scroll', ajustar);
      painel.style.removeProperty('--teclado');
      painel.style.removeProperty('--altura-visivel');
    };
  }, [aberto]);

  // Ao fechar, a próxima abertura volta sempre com o chat expandido.
  useEffect(() => {
    if (!aberto) setMinimizado(false);
  }, [aberto]);

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
      ref={painelRef}
      className={`${styles.painel} ${aberto ? styles.painelAberto : ''} ${minimizado ? styles.painelMinimizado : ''}`}
      aria-label="Assistente Santana"
      aria-hidden={!aberto}
      inert={!aberto}
    >
      <div className={styles.cabecalho}>
        <h3 className={styles.titulo}>Assistente Santana</h3>
        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.botaoFechar}
            onClick={() => setMinimizado((m) => !m)}
            aria-label={minimizado ? 'Expandir assistente' : 'Minimizar assistente'}
            aria-expanded={!minimizado}
          >
            {minimizado ? <Maximize2 size={16} /> : <Minus size={18} />}
          </button>
          <button type="button" className={styles.botaoFechar} onClick={aoFechar} aria-label="Fechar assistente">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className={styles.corpo}>
        <ChatAssistente aoAbrirManual={aoAbrirManual} />
      </div>
    </aside>
  );
}
