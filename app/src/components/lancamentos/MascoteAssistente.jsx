import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import animacaoAssistente from '../../assets/assistente-lottie.json';
import styles from './MascoteAssistente.module.css';

// Avatar do assistente: robô animado (Lottie) acenando em loop.
// Usado no botão flutuante e no chat.
export function MascoteAssistente({ size = 96, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const animacao = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animacaoAssistente,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    return () => animacao.destroy();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.wrapper} ${className || ''}`}
      role="img"
      aria-label="Assistente Santana"
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
