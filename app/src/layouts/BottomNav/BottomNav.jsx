import { MascoteAssistente } from '../../components/lancamentos/MascoteAssistente.jsx';
import styles from './BottomNav.module.css';

// Barra inferior do celular: só o assistente, centralizado. Os demais menus
// ficam no menu lateral (botão hambúrguer), que já tem todas as seções.
export function BottomNav({ aoAbrirNovoLancamento }) {
  return (
    <nav className={styles.nav} aria-label="Assistente">
      <div className={styles.botaoCentral}>
        <button
          type="button"
          className={styles.fab}
          onClick={aoAbrirNovoLancamento}
          aria-label="Lançar com o assistente"
        >
          <MascoteAssistente size={42} />
        </button>
      </div>
    </nav>
  );
}
