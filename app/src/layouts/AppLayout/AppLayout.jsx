import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar.jsx';
import { Header } from '../Header/Header.jsx';
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx';
import { MascoteAssistente } from '../../components/lancamentos/MascoteAssistente.jsx';
import { AssistenteModal } from '../../components/lancamentos/AssistenteModal.jsx';
import { NovoLancamentoModal } from '../../components/lancamentos/NovoLancamentoModal.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { NAV_ITEMS } from '../../utils/constantes.js';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const location = useLocation();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [sidebarRecolhida, setSidebarRecolhida] = useLocalStorage('sidebarRecolhida', false);
  const [modalAssistenteAberto, setModalAssistenteAberto] = useState(false);
  const [modalManualAberto, setModalManualAberto] = useState(false);

  const paginaAtual = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
  const titulo = paginaAtual?.label || 'Dashboard';

  function abrirManual() {
    setModalAssistenteAberto(false);
    setModalManualAberto(true);
  }

  return (
    <>
      <Sidebar
        aberta={menuMobileAberto}
        recolhida={sidebarRecolhida}
        aoFechar={() => setMenuMobileAberto(false)}
        aoAlternarRecolhida={() => setSidebarRecolhida((r) => !r)}
      />

      <div className={`${styles.main} ${sidebarRecolhida ? styles.mainRecolhido : ''}`}>
        <Header titulo={titulo} aoAbrirMenu={() => setMenuMobileAberto(true)} />
        <main className={styles.conteudo}>
          <ErrorBoundary chaveReset={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <button
        type="button"
        className={styles.fabDesktop}
        onClick={() => setModalAssistenteAberto(true)}
        aria-label="Lançar com o assistente"
      >
        <MascoteAssistente size={52} acenando />
      </button>

      <AssistenteModal
        aberto={modalAssistenteAberto}
        aoFechar={() => setModalAssistenteAberto(false)}
        aoAbrirManual={abrirManual}
      />
      <NovoLancamentoModal aberto={modalManualAberto} aoFechar={() => setModalManualAberto(false)} />
    </>
  );
}
