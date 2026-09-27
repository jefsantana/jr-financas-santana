// Mascote do assistente: o mesmo robozinho do ícone do botão "+", só que
// com espaço pra ter personalidade — usado no cabeçalho do chat pra deixar
// claro, de cara, que dali pra frente é a IA quem entende o que foi digitado
// e faz o lançamento sozinha. As cores vêm direto dos tokens do app
// (--cor-primaria e --cor-acento), então ele muda junto se a paleta mudar,
// e o "painel" no peito com o cifrão é o detalhe que amarra "robô" a
// "dinheiro" — pra não ser só mais um mascote de chatbot genérico.
export function MascoteAssistente({ size = 96, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} aria-hidden="true">
      <ellipse cx="100" cy="184" rx="48" ry="8" fill="#2D2D3A" opacity="0.08" />

      {/* antena + faísca */}
      <line x1="100" y1="34" x2="100" y2="18" stroke="var(--cor-primaria)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M100 4l2.6 5.8L108 12l-5.4 2.2L100 20l-2.6-5.8L92 12l5.4-2.2Z"
        fill="var(--cor-acento)"
      />

      {/* braços */}
      <path
        d="M56 118c-10 2-18 10-20 22"
        stroke="var(--cor-primaria-hover)"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M144 118c10 2 18 10 20 22"
        stroke="var(--cor-primaria-hover)"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />

      {/* corpo */}
      <rect x="54" y="88" width="92" height="76" rx="24" fill="var(--cor-primaria-hover)" />
      <rect x="78" y="108" width="44" height="36" rx="10" fill="var(--cor-superficie)" />
      <circle cx="100" cy="126" r="13" fill="var(--cor-acento)" />
      <text
        x="100"
        y="130.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="var(--cor-superficie)"
        fontFamily="var(--fonte-display, sans-serif)"
      >
        $
      </text>

      {/* cabeça */}
      <rect x="62" y="32" width="76" height="58" rx="22" fill="var(--cor-primaria)" />
      <circle cx="87" cy="60" r="7" fill="var(--cor-superficie)" />
      <circle cx="113" cy="60" r="7" fill="var(--cor-superficie)" />
      <circle cx="88.5" cy="61.5" r="3.2" fill="var(--cor-primaria-hover)" />
      <circle cx="114.5" cy="61.5" r="3.2" fill="var(--cor-primaria-hover)" />
      <path
        d="M86 74c4.2 3.6 9 5.4 14 5.4s9.8-1.8 14-5.4"
        stroke="var(--cor-superficie)"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
