import { useAuth } from '../../contexts/AuthContext.jsx';
import avatarRaquel from '../../assets/avatar-raquel.png';
import avatarJeferson from '../../assets/avatar-jeferson.png';
import styles from './MascoteAssistente.module.css';

// Avatar do assistente. Cada pessoa vê o seu, escolhido pelo nome do perfil logado.
// Com "acenando", o avatar balança de leve, como um tchau.
export function MascoteAssistente({ size = 96, className, acenando = false }) {
  const { perfil } = useAuth();
  const ehRaquel = (perfil?.nome || '').trim().toLowerCase().startsWith('raquel');
  const src = ehRaquel ? avatarRaquel : avatarJeferson;

  return (
    <img
      src={src}
      alt="Assistente Santana"
      width={size}
      height={size}
      className={`${styles.imagem} ${acenando ? styles.acenando : ''} ${className || ''}`}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
    />
  );
}
