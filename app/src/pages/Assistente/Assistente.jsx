import { Card } from '../../components/ui/index.js';
import { ChatAssistente } from '../../components/lancamentos/ChatAssistente.jsx';
import styles from './Assistente.module.css';

export default function Assistente() {
  return (
    <div className={styles.pagina}>
      <Card className={styles.chatCard}>
        <ChatAssistente />
      </Card>
    </div>
  );
}
