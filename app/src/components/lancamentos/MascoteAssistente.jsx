import avatarAssistenteSantana from '../../assets/assistente-santana.png';

// Avatar do assistente ("Assistente Santana") — usado no cabeçalho do chat e
// ao lado de toda mensagem do bot (inclusive as confirmações de lançamento),
// pra deixar visualmente claro, sempre, que quem está respondendo/registrando
// é o assistente de IA.
export function MascoteAssistente({ size = 96, className }) {
  return (
    <img
      src={avatarAssistenteSantana}
      alt="Assistente Santana"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  );
}
