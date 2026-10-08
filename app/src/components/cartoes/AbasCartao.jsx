import { NavLink } from 'react-router-dom';
import { CreditCard, Receipt, Layers } from 'lucide-react';
import styles from './AbasCartao.module.css';

const ABAS = [
  { path: '/cartoes', label: 'Cartões', icone: CreditCard },
  { path: '/faturas', label: 'Fatura', icone: Receipt },
  { path: '/parcelamentos', label: 'Parcelamentos', icone: Layers },
];

// Abas que agrupam tudo do cartão de crédito num lugar só (cadastro e
// limite, fatura do mês e compras parceladas), pra não ficarem espalhadas
// no menu.
export function AbasCartao() {
  return (
    <nav className={styles.abas} aria-label="Cartão de crédito">
      {ABAS.map(({ path, label, icone: Icone }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `${styles.aba} ${isActive ? styles.abaAtiva : ''}`}
        >
          <Icone size={15} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
