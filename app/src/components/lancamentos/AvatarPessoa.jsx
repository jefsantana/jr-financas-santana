import styles from './AvatarPessoa.module.css';

// Avatares 2D do assistente, um por pessoa, em estilo plano e com fundo
// transparente. O braço direito (lado direito da imagem) acena quando "acenando".
const PELE = '#F5CBA7';
const TERNO_RAQUEL = '#2D3142';
const TERNO_JEFERSON = '#2F4A6D';
const CABELO_RAQUEL = '#6B3E26';
const CABELO_JEFERSON = '#2E2118';

function Braco({ acenando, cor }) {
  return (
    <g className={acenando ? styles.braco : undefined}>
      <rect x="138" y="112" width="18" height="62" rx="9" fill={cor} />
      <circle cx="147" cy="104" r="10" fill={PELE} />
    </g>
  );
}

export function AvatarPessoa({ pessoa = 'raquel', size = 96, acenando = false, className }) {
  const ehRaquel = pessoa === 'raquel';
  const terno = ehRaquel ? TERNO_RAQUEL : TERNO_JEFERSON;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      className={`${styles.svg} ${className || ''}`}
      role="img"
      aria-label="Assistente Santana"
    >
      {/* corpo */}
      <path d="M46 240 Q50 166 100 158 Q150 166 154 240 Z" fill={terno} />
      <path d="M88 160 L100 196 L112 160 Z" fill="#FFFFFF" />
      {/* pescoço e cabeça */}
      <rect x="91" y="128" width="18" height="36" fill={PELE} />
      <ellipse cx="100" cy="92" rx="42" ry="46" fill={PELE} />
      {/* cabelo */}
      {ehRaquel ? (
        <>
          <path d="M56 96 Q48 36 100 34 Q152 36 144 96 Q150 136 138 146 L62 146 Q50 136 56 96 Z" fill={CABELO_RAQUEL} />
          <path d="M60 80 Q68 42 100 46 Q132 42 140 80 Q120 62 100 62 Q80 62 60 80 Z" fill={CABELO_RAQUEL} />
        </>
      ) : (
        <path d="M58 84 Q56 42 100 42 Q144 42 142 84 Q130 62 100 62 Q70 62 58 84 Z" fill={CABELO_JEFERSON} />
      )}
      {/* óculos (só Raquel) */}
      {ehRaquel && (
        <g fill="none" stroke={TERNO_RAQUEL} strokeWidth="4">
          <rect x="66" y="84" width="28" height="20" rx="6" />
          <rect x="106" y="84" width="28" height="20" rx="6" />
          <line x1="94" y1="92" x2="106" y2="92" />
        </g>
      )}
      {/* olhos e sorriso */}
      <circle cx="80" cy="95" r="4" fill="#2D3142" />
      <circle cx="120" cy="95" r="4" fill="#2D3142" />
      {/* barba (só Jeferson) */}
      {!ehRaquel && <path d="M74 112 Q80 140 100 142 Q120 140 126 112 Q112 124 100 124 Q88 124 74 112 Z" fill={CABELO_JEFERSON} />}
      <path d="M88 118 Q100 128 112 118" fill="none" stroke="#B5524B" strokeWidth="4" strokeLinecap="round" />
      {/* braço esquerdo (lado esquerdo da imagem), parado */}
      <rect x="44" y="164" width="16" height="62" rx="8" fill={terno} />
      {/* braço direito: acena */}
      <Braco acenando={acenando} cor={terno} />
      {ehRaquel && (
        <g transform="rotate(-14 74 196)">
          <rect x="60" y="180" width="28" height="36" rx="4" fill="#9AA5B1" />
          <rect x="63" y="184" width="22" height="7" rx="2" fill="#DDE3EA" />
        </g>
      )}
    </svg>
  );
}
