import { Modal } from '../ui/Modal/Modal.jsx';
import { ChatAssistente } from './ChatAssistente.jsx';

export function AssistenteModal({ aberto, aoFechar, aoAbrirManual }) {
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Assistente financeiro">
      <ChatAssistente aoAbrirManual={aoAbrirManual} />
    </Modal>
  );
}
