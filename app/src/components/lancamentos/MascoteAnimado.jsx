import styles from './MascoteAnimado.module.css';

// Versão vetorial do Assistente Santana, com as antenas balançando.
// Usada no botão flutuante. O avatar de chat (MascoteAssistente) continua sendo
// a imagem, porque lá o mascote não precisa se mexer.
export function MascoteAnimado({ size = 48, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={`${styles.mascote} ${className || ''}`}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mascoteAnimadoFundo" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B6BFF" />
          <stop offset="1" stopColor="#6A4EEA" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="256" fill="url(#mascoteAnimadoFundo)" />
      <g transform="translate(256 262) scale(0.84) translate(-256 -256)">
        {/* antenas: cada uma gira em torno da própria base */}
        <g className={styles.antenaEsquerda}>
          <line x1="192" y1="134" x2="176" y2="96" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
          <circle cx="174" cy="88" r="16" fill="#FF7A9C" />
        </g>
        <g className={styles.antenaDireita}>
          <line x1="320" y1="134" x2="336" y2="96" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
          <circle cx="338" cy="88" r="16" fill="#FF7A9C" />
        </g>
        <rect x="136" y="132" width="240" height="210" rx="78" fill="#FFFFFF" />
        <rect x="162" y="158" width="188" height="158" rx="54" fill="#2A2550" />
        <circle cx="220" cy="216" r="16" fill="#FFFFFF" />
        <circle cx="292" cy="216" r="16" fill="#FFFFFF" />
        <path d="M212 262 Q256 306 300 262" fill="none" stroke="#FF7A9C" strokeWidth="14" strokeLinecap="round" />
        <rect x="176" y="346" width="160" height="90" rx="44" fill="#FFFFFF" opacity="0.92" />
      </g>
    </svg>
  );
}
