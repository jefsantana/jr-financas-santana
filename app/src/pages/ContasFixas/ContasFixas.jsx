import { FileText } from 'lucide-react';
import CrudPage from '../_shared/CrudPage.jsx';
import { useCrudMock } from '../../hooks/useCrudMock.js';
import { formatarMoeda } from '../../utils/formatadores.js';
import { CategoriaComIcone } from '../../components/lancamentos/CategoriaComIcone.jsx';
import { useCategorias } from '../../contexts/CategoriasContext.jsx';

export default function ContasFixas() {
  const { categoriasGasto, iconesGasto } = useCategorias();
  const { registros: cartoes } = useCrudMock('Cartoes');
  const nomesCartoes = cartoes.map((c) => c.nome);

  const config = {
    tabela: 'ContasFixas',
    icone: FileText,
    tituloForm: 'Nova Conta Fixa',
    tituloLista: 'Contas fixas cadastradas',
    textoVazioLista: 'Cadastre a primeira conta fixa usando o formulário acima.',
    dica: 'Use para contas e assinaturas que se repetem todo mês sem data para acabar, como aluguel, internet ou Netflix. Se a cobrança é no cartão de crédito, escolha o cartão: no Dashboard o botão vira "Lançar na fatura" e o valor entra na fatura do cartão. Uma compra parcelada (ex: um notebook em 10x) vai em "Parcelamentos".',
    campos: [
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: Aluguel ou Netflix' },
      { nome: 'valor', rotulo: 'Valor (R$)', tipo: 'moeda', obrigatorio: true },
      { nome: 'diaVencimento', rotulo: 'Dia de vencimento / cobrança', tipo: 'numero', obrigatorio: true, min: 1, max: 31 },
      { nome: 'cartao', rotulo: 'Cartão (se for cobrado no crédito)', tipo: 'select', opcoes: nomesCartoes },
      {
        nome: 'categoria',
        rotulo: 'Categoria',
        tipo: 'select',
        obrigatorio: true,
        opcoes: categoriasGasto,
        iconePorValor: (valor) => iconesGasto[valor],
      },
    ],
    colunas: [
      { chave: 'descricao', rotulo: 'Descrição' },
      { chave: 'categoria', rotulo: 'Categoria', render: (r) => <CategoriaComIcone nome={r.categoria} /> },
      { chave: 'cartao', rotulo: 'Cartão', render: (r) => r.cartao || '-' },
      { chave: 'diaVencimento', rotulo: 'Vencimento', render: (r) => `Dia ${r.diaVencimento}` },
      { chave: 'valor', rotulo: 'Valor', numerica: true, render: (r) => <span className="valor-negativo">{formatarMoeda(r.valor)}</span> },
    ],
  };

  return <CrudPage config={config} />;
}
