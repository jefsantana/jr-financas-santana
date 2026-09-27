// Ícone customizado (não faz parte do lucide-react) desenhado no mesmo
// estilo de traço dos demais ícones do app, pra caber sem estranhar ao
// lado deles — mas com um detalhe só dele: a "faísca" de 4 pontas na
// antena, que marca esse robô como o assistente de IA, não um robô
// genérico. Aceita as mesmas props de tamanho/classe que um ícone do
// lucide-react, pra ser um substituto direto do <Plus />.
export function IconeAssistente({ size = 24, className, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 10.5h-1.6M19 10.5h1.6" />
      <rect x="5" y="6.5" width="14" height="12" rx="4" />
      <path d="M12 6.5V4" />
      <circle cx="9.6" cy="12.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="12.3" r="1" fill="currentColor" stroke="none" />
      <path d="M9.4 15.2c.7.6 1.5.9 2.6.9s1.9-.3 2.6-.9" />
      <path d="M12 1.4l.62 1.36L14 3.4l-1.38.64L12 5.4l-.62-1.36L10 3.4l1.38-.64Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
