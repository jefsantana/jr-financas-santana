import { useEffect, useRef, useState } from 'react';
import { Send, User } from 'lucide-react';
import { MascoteAssistente } from './MascoteAssistente.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import styles from './ChatAssistente.module.css';

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL;

const MENSAGEM_BOAS_VINDAS = {
  autor: 'bot',
  texto:
    'Oi! Pode me contar um gasto, uma entrada, uma conta fixa, ou perguntar seu saldo — igual você já faz no grupo do WhatsApp. Ex: "gastei 45 no mercado, no pix".',
};

export function ChatAssistente({ aoAbrirManual }) {
  const { sessao, pessoas } = useAuth();
  const toast = useToast();

  const [pessoa, setPessoa] = useState(pessoas[0] || '');
  const [mensagens, setMensagens] = useState([MENSAGEM_BOAS_VINDAS]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fimDaListaRef = useRef(null);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  async function enviarMensagem(evento) {
    evento.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;

    if (!BOT_API_URL) {
      toast.erro('Assistente não configurado: falta VITE_BOT_API_URL no ambiente do site.');
      return;
    }

    setMensagens((atuais) => [...atuais, { autor: 'usuario', texto: mensagem }]);
    setTexto('');
    setEnviando(true);

    try {
      const resp = await fetch(`${BOT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessao?.access_token}`,
        },
        body: JSON.stringify({ mensagem, pessoa }),
      });
      const dados = await resp.json();

      if (!resp.ok) {
        setMensagens((atuais) => [
          ...atuais,
          { autor: 'bot', texto: dados.erro || 'Não consegui processar essa mensagem agora.' },
        ]);
        return;
      }

      const respostas = dados.respostas?.length ? dados.respostas : ['🤔 Não tive uma resposta pra isso.'];
      setMensagens((atuais) => [...atuais, ...respostas.map((r) => ({ autor: 'bot', texto: r }))]);
    } catch {
      setMensagens((atuais) => [
        ...atuais,
        { autor: 'bot', texto: 'Não consegui falar com o assistente agora. Verifique sua conexão e tente de novo.' },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.cabecalho}>
        <MascoteAssistente size={56} />
        <div>
          <p className={styles.cabecalhoTitulo}>Assistente financeiro</p>
          <p className={styles.cabecalhoSubtitulo}>Descreva o lançamento — eu entendo e registro pra você.</p>
        </div>
      </div>

      {pessoas.length > 1 && (
        <div className={styles.seletorPessoa} role="group" aria-label="Enviando como">
          <span className={styles.seletorRotulo}>Enviando como:</span>
          {pessoas.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.opcaoPessoa} ${pessoa === p ? styles.opcaoPessoaAtiva : ''}`}
              onClick={() => setPessoa(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className={styles.listaMensagens}>
        {mensagens.map((m, indice) => (
          <div key={indice} className={`${styles.linha} ${m.autor === 'usuario' ? styles.linhaUsuario : ''}`}>
            <div className={styles.avatarBolha}>
              {m.autor === 'usuario' ? <User size={16} /> : <MascoteAssistente size={26} />}
            </div>
            <div className={`${styles.bolha} ${m.autor === 'usuario' ? styles.bolhaUsuario : styles.bolhaBot}`}>
              {m.texto}
            </div>
          </div>
        ))}
        {enviando && (
          <div className={styles.linha}>
            <div className={styles.avatarBolha}>
              <MascoteAssistente size={26} />
            </div>
            <div className={`${styles.bolha} ${styles.bolhaBot} ${styles.digitando}`}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={fimDaListaRef} />
      </div>

      <form className={styles.formulario} onSubmit={enviarMensagem}>
        <input
          className={styles.campoTexto}
          type="text"
          placeholder="Ex: gastei 45 no mercado, no pix"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={enviando}
        />
        <button type="submit" className={styles.botaoEnviar} disabled={!texto.trim() || enviando} aria-label="Enviar">
          <Send size={18} />
        </button>
      </form>

      {aoAbrirManual && (
        <button type="button" className={styles.linkManual} onClick={aoAbrirManual}>
          Prefere preencher manualmente?
        </button>
      )}
    </div>
  );
}
