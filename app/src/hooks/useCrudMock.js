import { useCallback, useEffect, useState } from 'react';
import * as api from '../services/dados.js';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export function useCrudMock(tabela) {
  const { perfil } = useAuth();
  const toast = useToast();
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await api.listar(tabela);
      setRegistros(dados);
    } catch (erro) {
      toast.erro('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.');
      throw erro;
    } finally {
      setCarregando(false);
    }
  }, [tabela, toast]);

  useEffect(() => {
    if (perfil?.familia_id) recarregar();
  }, [recarregar, perfil?.familia_id]);

  // Tempo real: sem isso, um lançamento feito em outra aba, por outra
  // pessoa da família, ou pelo assistente de IA (que grava direto no banco,
  // por fora do app) só aparecia depois de um F5 — cada tela só recarregava
  // sozinha quando VOCÊ MESMO salvava algo por ELA. Qualquer INSERT/UPDATE/
  // DELETE na tabela (de qualquer origem) agora recarrega esta tela também.
  useEffect(() => {
    if (!perfil?.familia_id) return;
    const nomeTab = api.nomeTabela(tabela);
    const canal = supabase
      .channel(`realtime-${nomeTab}-${perfil.familia_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: nomeTab, filter: `familia_id=eq.${perfil.familia_id}` },
        () => recarregar()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [tabela, perfil?.familia_id, recarregar]);

  const salvar = useCallback(
    async (dados) => {
      setSalvando(true);
      try {
        await api.criar(tabela, dados, perfil?.familia_id);
        await recarregar();
      } catch (erro) {
        toast.erro('Não foi possível salvar. Tente novamente.');
        throw erro;
      } finally {
        setSalvando(false);
      }
    },
    [tabela, recarregar, perfil?.familia_id, toast]
  );

  const editar = useCallback(
    async (id, campos) => {
      setSalvando(true);
      try {
        await api.atualizar(tabela, id, campos);
        await recarregar();
      } catch (erro) {
        toast.erro('Não foi possível salvar as alterações. Tente novamente.');
        throw erro;
      } finally {
        setSalvando(false);
      }
    },
    [tabela, recarregar, toast]
  );

  const remover = useCallback(
    async (id, pessoa) => {
      try {
        await api.excluir(tabela, id, pessoa);
        await recarregar();
      } catch (erro) {
        toast.erro('Não foi possível excluir o registro. Tente novamente.');
        throw erro;
      }
    },
    [tabela, recarregar, toast]
  );

  return { registros, carregando, salvando, salvar, editar, remover, recarregar };
}
