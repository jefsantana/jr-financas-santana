import { useAuth } from '../../contexts/AuthContext.jsx';
import { AvatarPessoa } from './AvatarPessoa.jsx';

// Avatar do assistente: Raquel vê a personagem feminina e Jeferson vê a masculina,
// escolhidas pelo nome do perfil logado. "acenando" faz o braço balançar.
export function MascoteAssistente({ size = 96, className, acenando = false }) {
  const { perfil } = useAuth();
  const pessoa = (perfil?.nome || '').trim().toLowerCase().startsWith('raquel') ? 'raquel' : 'jeferson';
  return <AvatarPessoa pessoa={pessoa} size={size} acenando={acenando} className={className} />;
}
