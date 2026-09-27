import { useEffect, useRef, useState } from 'react';
import { Send, User, Camera, Mic, Square } from 'lucide-react';
import { MascoteAssistente } from './MascoteAssistente.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import styles from './ChatAssistente.module.css';

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL;

const MENSAGEM_BOAS_VINDAS = {
  autor: 'bot',
  texto:
    'Oi! Pode me contar um gasto, uma entrada, uma conta fixa, ou perguntar seu saldo, mandar uma foto do comprovante ou até um áudio — igual você já faz no grupo do WhatsApp. Ex: "gastei 45 no mercado, no pix".',
};

// Lê um File/Blob e devolve só a parte base64 (sem o prefixo "data:...;base64,").
function lerComoBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] || '');
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

export function ChatAssistente({ aoAbrirManual }) {
  const { sessao, pessoas } = useAuth();
  const toast = useToast();

  const [pessoa, setPessoa] = useState(pessoas[0] || '');
  const [mensagens, setMensagens] = useState([MENSAGEM_BOAS_VINDAS]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const fimDaListaRef = useRef(null);
  const inputImagemRef = useRef(null);
  const gravadorRef = useRef(null);
  const pedacosAudioRef = useRef([]);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  // Núcleo comum: manda o payload pro /chat (texto, imagem ou áudio — o que
  // muda é só o corpo da requisição) e traduz a resposta em bolhas do bot.
  async function enviarAoBot(corpo) {
    if (!BOT_API_URL) {
      toast.erro('Assistente não configurado: falta VITE_BOT_API_URL no ambiente do site.');
      return;
    }
    setEnviando(true);
    try {
      const resp = await fetch(`${BOT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessao?.access_token}`,
        },
        body: JSON.stringify({ ...corpo, pessoa }),
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

  async function enviarMensagem(evento) {
    evento.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;

    setMensagens((atuais) => [...atuais, { autor: 'usuario', texto: mensagem }]);
    setTexto('');
    await enviarAoBot({ mensagem });
  }

  async function aoSelecionarImagem(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!arquivo || enviando) return;

    const urlPreview = URL.createObjectURL(arquivo);
    setMensagens((atuais) => [...atuais, { autor: 'usuario', imagemUrl: urlPreview, texto: '📎 Comprovante enviado' }]);

    const imagemBase64 = await lerComoBase64(arquivo);
    await enviarAoBot({ imagemBase64, imagemMimetype: arquivo.type || 'image/jpeg', legenda: '' });
  }

  async function alternarGravacao() {
    if (gravando) {
      gravadorRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const gravador = new MediaRecorder(stream);
      pedacosAudioRef.current = [];

      gravador.ondataavailable = (evento) => {
        if (evento.data.size > 0) pedacosAudioRef.current.push(evento.data);
      };

      gravador.onstop = async () => {
        stream.getTracks().forEach((faixa) => faixa.stop());
        setGravando(false);

        const blob = new Blob(pedacosAudioRef.current, { type: gravador.mimeType || 'audio/webm' });
        if (blob.size === 0) return;

        setMensagens((atuais) => [...atuais, { autor: 'usuario', texto: '🎤 Áudio enviado' }]);
        const audioBase64 = await lerComoBase64(blob);
        await enviarAoBot({ audioBase64, audioMimetype: blob.type });
      };

      gravadorRef.current = gravador;
      gravador.start();
      setGravando(true);
    } catch {
      toast.erro('Não consegui acessar o microfone. Verifique a permissão do navegador.');
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.cabecalho}>
        <MascoteAssistente size={56} />
        <div>
          <p className={styles.cabecalhoTitulo}>Assistente financeiro</p>
          <p className={styles.cabecalhoSubtitulo}>Descreva, fotografe ou fale o lançamento — eu registro pra você.</p>
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
              {m.imagemUrl && <img src={m.imagemUrl} alt="Comprovante enviado" className={styles.imagemEnviada} />}
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
          ref={inputImagemRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={aoSelecionarImagem}
        />
        <button
          type="button"
          className={styles.botaoSecundario}
          onClick={() => inputImagemRef.current?.click()}
          disabled={enviando || gravando}
          aria-label="Enviar foto de comprovante"
          title="Enviar foto de comprovante"
        >
          <Camera size={18} />
        </button>
        <button
          type="button"
          className={`${styles.botaoSecundario} ${gravando ? styles.botaoGravando : ''}`}
          onClick={alternarGravacao}
          disabled={enviando}
          aria-label={gravando ? 'Parar gravação' : 'Gravar áudio'}
          title={gravando ? 'Parar gravação' : 'Gravar áudio'}
        >
          {gravando ? <Square size={16} /> : <Mic size={18} />}
        </button>
        <input
          className={styles.campoTexto}
          type="text"
          placeholder={gravando ? 'Gravando áudio...' : 'Ex: gastei 45 no mercado, no pix'}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={enviando || gravando}
        />
        <button
          type="submit"
          className={styles.botaoEnviar}
          disabled={!texto.trim() || enviando || gravando}
          aria-label="Enviar"
        >
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
