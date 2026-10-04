import { useEffect, useRef } from 'react';
import { TalkingHead } from '@met4citizen/talkinghead';
import styles from './Avatar3D.module.css';

// Avatar 3D do assistente no botão flutuante. Raquel vê o personagem feminino
// e Jeferson o masculino. "acenando" dispara o gesto de mão levantada (handup)
// a cada poucos segundos, pra parecer um tchau.
const PERSONAGENS = {
  raquel: { url: '/avatars/brunette.glb', body: 'F' },
  jeferson: { url: '/avatars/mpfb.glb', body: 'M' },
};

export function Avatar3D({ pessoa = 'raquel', size = 56, acenando = false }) {
  const containerRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    const head = new TalkingHead(containerRef.current, { cameraView: 'upper', lipsyncLang: 'pt' });
    headRef.current = head;
    const { url, body } = PERSONAGENS[pessoa] || PERSONAGENS.raquel;
    head.showAvatar({ url, body, avatarMood: 'neutral' }).catch((erro) => {
      if (!cancelado) console.warn('Não foi possível carregar o avatar 3D:', erro);
    });
    return () => {
      cancelado = true;
      try {
        head.stop();
      } catch {
        // o avatar pode nem ter carregado ainda
      }
      headRef.current = null;
    };
  }, [pessoa]);

  useEffect(() => {
    if (!acenando) return undefined;
    const acenar = () => headRef.current?.playGesture('handup', 2.5, false, 800);
    const primeiro = setTimeout(acenar, 1500);
    const intervalo = setInterval(acenar, 6000);
    return () => {
      clearTimeout(primeiro);
      clearInterval(intervalo);
    };
  }, [acenando]);

  return <div ref={containerRef} className={styles.container} style={{ width: size, height: size }} />;
}
