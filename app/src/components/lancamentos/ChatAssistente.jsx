import { useEffect, useRef, useState } from 'react';
import { Send, Camera, Mic, X } from 'lucide-react';
import { MascoteAssistente } from './MascoteAssistente.jsx';
import { Avatar } from '../ui/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { saudacao } from '../../utils/formatadores.js';
import styles from './ChatAssistente.module.css';

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL;


// Lê um File/Blob e devolve só a parte base64 (sem o prefixo "data:...;base64,").
function lerComoBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] || '');
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

function formatarDuracao(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Emojis e as marcações estilo WhatsApp (*negrito*) que os cartões do bot
// usam atrapalham a leitura em voz alta — a Web Speech API tenta "ler" cada
// emoji e cada asterisco em vez de pular.
function limparParaFala(texto) {
  return texto
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\*/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lê a resposta em voz alta usando a síntese de voz do próprio navegador —
// sem custo e sem precisar mandar áudio pro/do servidor.
function falarResposta(texto) {
  if (!('speechSynthesis' in window)) return;
  const limpo = limparParaFala(texto);
  if (!limpo) return;

  const utterance = new SpeechSynthesisUtterance(limpo);
  utterance.lang = 'pt-BR';
  const vozes = window.speechSynthesis.getVoices();
  const vozPtBr = vozes.find((v) => v.lang === 'pt-BR') || vozes.find((v) => v.lang?.startsWith('pt'));
  if (vozPtBr) utterance.voice = vozPtBr;
  window.speechSynthesis.speak(utterance);
}

export function ChatAssistente({ aoAbrirManual }) {
  const { sessao, perfil, pessoas } = useAuth();
  const toast = useToast();

  // Detecta automaticamente quem está lançando pelo próprio login, em vez de
  // perguntar toda vez: cada pessoa da família tem a própria conta separada,
  // e o nome cadastrado nela (perfil.nome) já é o mesmo nome usado nos
  // lançamentos (familia.pessoa_1/pessoa_2) — então basta casar um com o
  // outro. Só cai no seletor manual se não achar uma correspondência clara
  // (ex: os nomes foram cadastrados de forma diferente).
  const pessoaDetectada = pessoas.find(
    (p) => p.trim().toLowerCase() === (perfil?.nome || '').trim().toLowerCase()
  );
  const [pessoaManual, setPessoaManual] = useState(null);
  const pessoa = pessoaManual || pessoaDetectada || pessoas[0] || '';

  // Saudação pelo horário e pelo nome de quem está logado. Calculada a cada
  // render (não guardada no estado) pra acompanhar a hora do dia e o perfil,
  // que pode terminar de carregar depois do chat montar.
  const primeiroNome = (pessoaDetectada || perfil?.nome || '').trim().split(/s+/)[0];
  const boasVindas = {
    autor: 'bot',
    texto: `${saudacao()}${primeiroNome ? ` ${primeiroNome}` : ''}, bora lançar? 🚀`,
  };
  const mensagensVisiveis = [boasVindas, ...mensagens];
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [duracaoGravacao, setDuracaoGravacao] = useState(0);
  const fimDaListaRef = useRef(null);
  const inputImagemRef = useRef(null);
  const gravadorRef = useRef(null);
  const streamRef = useRef(null);
  const pedacosAudioRef = useRef([]);
  const canceladoRef = useRef(false);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  // Solta o dedo/mouse em QUALQUER lugar da tela (não só em cima do botão) já
  // encerra a gravação e envia — igual o WhatsApp: segurar grava, soltar envia.
  useEffect(() => {
    if (!gravando) return;
    const aoSoltar = () => pararGravacao({ cancelar: false });
    window.addEventListener('pointerup', aoSoltar);
    const cronometro = setInterval(() => setDuracaoGravacao((d) => d + 1), 1000);
    return () => {
      window.removeEventListener('pointerup', aoSoltar);
      clearInterval(cronometro);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gravando]);

  // Núcleo comum: manda o payload pro /chat (texto, imagem ou áudio — o que
  // muda é só o corpo da requisição) e traduz a resposta em bolhas do bot.
  async function enviarAoBot(corpo, { falar = false } = {}) {
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
        const erro = dados.erro || 'Não consegui processar essa mensagem agora.';
        setMensagens((atuais) => [...atuais, { autor: 'bot', texto: erro }]);
        if (falar) falarResposta(erro);
        return;
      }

      const respostas = dados.respostas?.length ? dados.respostas : ['🤔 Fiquei sem resposta. Tenta de novo?'];
      setMensagens((atuais) => [...atuais, ...respostas.map((r) => ({ autor: 'bot', texto: r }))]);
      if (falar) {
        window.speechSynthesis?.cancel();
        respostas.forEach(falarResposta);
      }
    } catch {
      const erro = 'Fiquei sem sinal por aqui 📡 Tenta de novo?';
      setMensagens((atuais) => [...atuais, { autor: 'bot', texto: erro }]);
      if (falar) falarResposta(erro);
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

  async function iniciarGravacao(evento) {
    evento.preventDefault();
    if (enviando || gravando || texto.trim()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const gravador = new MediaRecorder(stream);
      pedacosAudioRef.current = [];
      canceladoRef.current = false;
      streamRef.current = stream;

      gravador.ondataavailable = (e) => {
        if (e.data.size > 0) pedacosAudioRef.current.push(e.data);
      };

      gravador.onstop = async () => {
        streamRef.current?.getTracks().forEach((faixa) => faixa.stop());
        setGravando(false);
        setDuracaoGravacao(0);

        if (canceladoRef.current) {
          pedacosAudioRef.current = [];
          return;
        }
        const blob = new Blob(pedacosAudioRef.current, { type: gravador.mimeType || 'audio/webm' });
        if (blob.size === 0) return;

        setMensagens((atuais) => [...atuais, { autor: 'usuario', texto: '🎤 Áudio enviado' }]);
        const audioBase64 = await lerComoBase64(blob);
        await enviarAoBot({ audioBase64, audioMimetype: blob.type }, { falar: true });
      };

      gravadorRef.current = gravador;
      gravador.start();
      setGravando(true);
    } catch {
      toast.erro('Não consegui acessar o microfone. Verifique a permissão do navegador.');
    }
  }

  function pararGravacao({ cancelar }) {
    if (!gravadorRef.current || gravadorRef.current.state === 'inactive') return;
    canceladoRef.current = cancelar;
    gravadorRef.current.stop();
  }

  return (
    <div className={styles.chat}>
      <div className={styles.cabecalho}>
        <MascoteAssistente size={56} />
        <div>
          <p className={styles.cabecalhoTitulo}>Assistente Santana</p>
          <p className={styles.cabecalhoSubtitulo}>Escreva, fale ou mande a foto.</p>
          {pessoaDetectada && <p className={styles.cabecalhoPessoa}>Lançando como {pessoaDetectada}</p>}
        </div>
      </div>

      {pessoas.length > 1 && !pessoaDetectada && (
        <div className={styles.seletorPessoa} role="group" aria-label="Enviando como">
          <span className={styles.seletorRotulo}>Não identifiquei automaticamente — enviando como:</span>
          {pessoas.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.opcaoPessoa} ${pessoa === p ? styles.opcaoPessoaAtiva : ''}`}
              onClick={() => setPessoaManual(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className={styles.listaMensagens}>
        {mensagensVisiveis.map((m, indice) => (
          <div key={indice} className={`${styles.linha} ${m.autor === 'usuario' ? styles.linhaUsuario : ''}`}>
            <div className={styles.avatarBolha}>
              {m.autor === 'usuario' ? <Avatar nome={pessoa} tamanho="pequeno" /> : <MascoteAssistente size={26} />}
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

        {gravando ? (
          <div className={styles.faixaGravando}>
            <button
              type="button"
              className={styles.botaoCancelarGravacao}
              onClick={() => pararGravacao({ cancelar: true })}
              aria-label="Cancelar gravação"
            >
              <X size={16} />
            </button>
            <span className={styles.pontoGravando} />
            <span className={styles.duracaoGravando}>{formatarDuracao(duracaoGravacao)}</span>
            <span className={styles.dicaGravando}>Solte para enviar</span>
          </div>
        ) : (
          <input
            className={styles.campoTexto}
            type="text"
            placeholder="Ex: gastei 45 no mercado, no pix"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={enviando}
          />
        )}

        {!texto.trim() && !gravando && (
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={() => inputImagemRef.current?.click()}
            disabled={enviando}
            aria-label="Enviar foto de comprovante"
            title="Enviar foto de comprovante"
          >
            <Camera size={18} />
          </button>
        )}

        {texto.trim() ? (
          <button type="submit" className={styles.botaoEnviar} disabled={enviando} aria-label="Enviar">
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.botaoEnviar} ${gravando ? styles.botaoGravandoAtivo : ''}`}
            onPointerDown={iniciarGravacao}
            disabled={enviando}
            aria-label="Segure para gravar um áudio"
            title="Segure para gravar um áudio"
          >
            <Mic size={18} />
          </button>
        )}
      </form>

      {aoAbrirManual && (
        <button type="button" className={styles.linkManual} onClick={aoAbrirManual}>
          Prefere preencher manualmente?
        </button>
      )}
    </div>
  );
}
