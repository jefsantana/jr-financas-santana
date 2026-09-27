import { useCallback, useEffect, useState } from 'react';
import { listar, nomeTabela } from '../services/dados.js';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const TABELAS = [
  'Entradas',
  'Gastos',
  'ContasFixas',
  'PagamentosContasFixas',
  'Parcelamentos',
  'PagamentosParcelamentos',
  'Metas',
  'Orcamentos',
  'Cartoes',
  'ComprasCartao',
  'MovimentosCartaoAlimentacao',
  'CartoesAlimentacao',
];

export function useDashboardData() {
  const { perfil } = useAuth();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [
        entradas,
        gastos,
        contasFixas,
        pagamentos,
        parcelamentos,
        pagamentosParcelamentos,
        metas,
        orcamentos,
        cartoes,
        comprasCartao,
        movimentosCartaoAlimentacao,
        cartoesAlimentacao,
      ] = await Promise.all(TABELAS.map((tabela) => listar(tabela)));
      setDados({
        entradas,
        gastos,
        contasFixas,
        pagamentos,
        parcelamentos,
        pagamentosParcelamentos,
        metas,
        orcamentos,
        cartoes,
        comprasCartao,
        movimentosCartaoAlimentacao,
        cartoesAlimentacao,
      });
    } catch (falha) {
      setErro(falha);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (perfil?.familia_id) recarregar();
  }, [recarregar, perfil?.familia_id]);

  // Tempo real: o Dashboard resume TODAS as tabelas acima — sem escutar
  // mudanças nelas, um lançamento novo (manual, ou feito pelo assistente de
  // IA por fora do app) só aparecia aqui depois de um F5. Uma pendência de
  // mudança em qualquer uma delas recarrega o resumo inteiro.
  useEffect(() => {
    if (!perfil?.familia_id) return;
    let canal = supabase.channel(`realtime-dashboard-${perfil.familia_id}`);
    for (const tabela of TABELAS) {
      canal = canal.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: nomeTabela(tabela), filter: `familia_id=eq.${perfil.familia_id}` },
        () => recarregar()
      );
    }
    canal.subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [perfil?.familia_id, recarregar]);

  return { dados, carregando, erro, recarregar };
}
