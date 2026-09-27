import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

// Sem isso, qualquer erro de JavaScript ao renderizar uma tela (ex: um
// dado inesperado vindo do banco) derruba a árvore inteira do React e
// deixa a página em branco, sem nenhuma pista do que aconteceu. Com o
// boundary, só a tela que quebrou mostra o aviso — o menu continua
// funcionando — e a mensagem do erro fica visível pra poder ser
// reportada e corrigida.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('Erro ao renderizar a tela:', erro, info.componentStack);
  }

  componentDidUpdate(propsAnteriores) {
    if (propsAnteriores.chaveReset !== this.props.chaveReset && this.state.erro) {
      this.setState({ erro: null });
    }
  }

  render() {
    if (!this.state.erro) return this.props.children;

    return (
      <div className={styles.container}>
        <AlertTriangle size={32} className={styles.icone} />
        <h2>Essa tela não carregou</h2>
        <p>Algo deu errado ao mostrar essa página. Tente recarregar — se continuar, avise com a mensagem abaixo.</p>
        <pre className={styles.detalhe}>{String(this.state.erro?.message || this.state.erro)}</pre>
        <button type="button" className={styles.botao} onClick={() => window.location.reload()}>
          Recarregar página
        </button>
      </div>
    );
  }
}
