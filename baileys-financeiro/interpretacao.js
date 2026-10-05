// Regras determinísticas de interpretação das mensagens do WhatsApp.
// Ficam fora da IA de propósito: a IA pode errar a data ou inventar o nome de
// um cartão, e essas duas coisas precisam ser verificadas no código.

const { DateTime } = require('luxon');

// Tipos que gravam uma data no banco (os demais não têm data de lançamento).
const TIPOS_COM_DATA = ['gasto', 'entrada', 'compra_cartao', 'gasto_alimentacao', 'recarga_alimentacao'];

// Termos genéricos de vale-alimentação. Quando a pessoa usa um deles (ex:
// "gastei 60 no vale"), a IA pode escolher o único cartão cadastrado sem que
// o nome dele apareça na mensagem — isso é aceitável.
const TERMOS_GENERICOS_ALIMENTACAO = /\b(vale|vales|alimenta\w*|refei\w*|alelo|sodexo|ticket)\b/;

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const MESES = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

// Monta 'yyyy-MM-dd' a partir de dia/mês (e ano opcional). Sem ano, assume o
// ano atual — e, se isso cair no futuro (ex: "30/12" em outubro), o ano
// passado, já que as pessoas lançam o que JÁ aconteceu. Data inexistente
// (31/02) vira null em vez de virar outra data.
function montarData(dia, mes, ano, hoje) {
  let anoFinal = ano;
  if (anoFinal === undefined) {
    anoFinal = hoje.year;
    const candidata = DateTime.fromObject({ year: anoFinal, month: mes, day: dia }, { zone: hoje.zone });
    if (candidata.isValid && candidata > hoje) anoFinal -= 1;
  } else if (anoFinal < 100) {
    anoFinal += 2000;
  }
  const data = DateTime.fromObject({ year: anoFinal, month: mes, day: dia }, { zone: hoje.zone });
  return data.isValid ? data.toFormat('yyyy-MM-dd') : null;
}

// Lê a data só de expressões explícitas no texto: "hoje", "ontem", "anteontem",
// "30/09", "30/09/2026", "30 de setembro", "dia 5" e "dia 5 do mês passado".
// Retorna 'yyyy-MM-dd' ou null (sem data explícita, o sistema usa a data de
// hoje, como antes).
function extrairDataDaMensagem(texto, hoje) {
  const t = normalizarTexto(texto);
  if (/\banteontem\b/.test(t)) return hoje.minus({ days: 2 }).toFormat('yyyy-MM-dd');
  if (/\bontem\b/.test(t)) return hoje.minus({ days: 1 }).toFormat('yyyy-MM-dd');
  if (/\bhoje\b/.test(t)) return hoje.toFormat('yyyy-MM-dd');

  const dataBarra = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dataBarra) {
    const data = montarData(Number(dataBarra[1]), Number(dataBarra[2]), dataBarra[3] ? Number(dataBarra[3]) : undefined, hoje);
    if (data) return data;
  }
  const dataPorExtenso = t.match(/\b(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(\d{4}))?\b/);
  if (dataPorExtenso) {
    const data = montarData(Number(dataPorExtenso[1]), MESES[dataPorExtenso[2]], dataPorExtenso[3] ? Number(dataPorExtenso[3]) : undefined, hoje);
    if (data) return data;
  }

  const diaMes = t.match(/\bdia (\d{1,2})\b(?:\s+d[oe]\s+mes\s+(passado|anterior))?/);
  if (diaMes) {
    const dia = Number(diaMes[1]);
    if (dia < 1 || dia > 31) return null;
    // "dia 5 do mês passado" força o mês anterior. "dia 25" sem mês, num dia 3,
    // ainda não aconteceu neste mês — então é do mês passado.
    const mesAnterior = Boolean(diaMes[2]) || dia > hoje.day;
    const base = mesAnterior ? hoje.minus({ months: 1 }) : hoje;
    if (dia > base.daysInMonth) return null;
    return base.set({ day: dia }).toFormat('yyyy-MM-dd');
  }
  return null;
}

// Aplica a data lida do texto ao lançamento. A data que a IA tenha devolvido
// é descartada: só vale a data explícita da mensagem (ou a já guardada numa
// pendência anterior).
function aplicarDataDaMensagem(dados, texto, hoje, dataAnterior = null) {
  // "correcao" também lê a data: é assim que a pessoa muda a data de um
  // lançamento que já foi salvo ("altera a entrada pra 30/09").
  if (!dados || !(TIPOS_COM_DATA.includes(dados.tipo) || dados.tipo === 'correcao')) return dados;
  const dataExtraida = extrairDataDaMensagem(texto, hoje);
  dados.data = dataExtraida || dataAnterior || null;
  return dados;
}

// Procura se a mensagem cita um nome (sem acento, sem diferenciar maiúsculas,
// palavra inteira). "VR" não casa com "Ticket" nem com "visa".
function mencionaNome(texto, nome) {
  if (!nome) return false;
  const alvo = normalizarTexto(nome).trim();
  if (!alvo) return false;
  const escapado = alvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapado}([^a-z0-9]|$)`).test(normalizarTexto(texto));
}

function cartaoExiste(nome, nomesCadastrados) {
  const alvo = normalizarTexto(nome).trim();
  return nomesCadastrados.some((n) => normalizarTexto(n).trim() === alvo);
}

// Decide o que fazer com o cartão alimentação citado:
// - 'usar': o cartão existe e a mensagem é coerente com ele.
// - 'criar': a pessoa digitou um nome novo de propósito (ex: "recarga no VR").
// - 'perguntar': o nome não existe e a pessoa não o citou — não se escolhe
//   outro cartão no palpite (foi isso que trocou o VR pelo Ticket).
function decidirCartaoAlimentacao({ cartao, texto, nomesCadastrados }) {
  if (!cartao) {
    if (nomesCadastrados.length === 1) return { acao: 'usar', nome: nomesCadastrados[0] };
    return { acao: 'perguntar' };
  }
  if (cartaoExiste(cartao, nomesCadastrados)) {
    const nomeReal = nomesCadastrados.find((n) => normalizarTexto(n).trim() === normalizarTexto(cartao).trim());
    if (mencionaNome(texto, cartao) || TERMOS_GENERICOS_ALIMENTACAO.test(normalizarTexto(texto))) {
      return { acao: 'usar', nome: nomeReal };
    }
    return { acao: 'perguntar' };
  }
  if (mencionaNome(texto, cartao)) return { acao: 'criar', nome: cartao.trim() };
  return { acao: 'perguntar' };
}

// Lista de lançamentos da mensagem: quando a IA devolve mais de um, cada item
// vira um lançamento. Com um único item, os campos dele assumem o topo.
function itensDoLancamento(dados) {
  if (!dados || !Array.isArray(dados.itens) || dados.itens.length === 0) return null;
  return dados.itens;
}

module.exports = {
  TIPOS_COM_DATA,
  normalizarTexto,
  extrairDataDaMensagem,
  aplicarDataDaMensagem,
  mencionaNome,
  decidirCartaoAlimentacao,
  itensDoLancamento,
};
