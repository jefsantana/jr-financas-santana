import { useAuth } from '../../contexts/AuthContext.jsx';
import avatarRaquel from '../../assets/avatar-raquel.png';
import avatarJeferson from '../../assets/avatar-jeferson.png';
import styles from './MascoteAssistente.module.css';

// Avatar do assistente. Cada pessoa vê o seu: a Raquel vê o avatar dela e o
// Jeferson vê o dele (escolhido pelo nome do perfil logado).
export function MascoteAssistente({ size = 96, className, acenando = false }) {
  const { perfil } = useAuth();
  const ehRaquel = (perfil?.nome || '').trim().toLowerCase().startsWith('raquel');
  const src = ehRaquel ? avatarRaquel : avatarJeferson;

  return (
    <span className={`${styles.wrapper} ${className || ''}`} style={{ width: size, height: size }}>
      <img src={src} alt="Assistente Santana" width={size} height={size} className={styles.imagem} />
      {acenando && (
        <svg className={styles.braco} viewBox="0 0 512 512" aria-hidden="true">
          {/* braço direito: gira a partir do ombro e sobe, acenando */}
          <g className={styles.bracoGrupo}>
            <rect x="372" y="300" width="36" height="120" rx="18" fill="#EDEEF1" stroke="#D6D8DE" strokeWidth="3" />
            <circle cx="390" cy="296" r="22" fill="#EDEEF1" stroke="#D6D8DE" strokeWidth="3" />
          </g>
        </svg>
      )}
    </span>
  );
}
