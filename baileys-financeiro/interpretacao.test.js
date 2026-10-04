const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DateTime } = require('luxon');
const {
  extrairDataDaMensagem,
  aplicarDataDaMensagem,
  mencionaNome,
  decidirCartaoAlimentacao,
  itensDoLancamento,
} = require('./interpretacao.js');

// Hoje fixo: 3 de outubro de 2026 (mesma data em que as falhas foram observadas).
const HOJE = DateTime.fromISO('2026-10-03', { zone: 'America/Sao_Paulo' });

test('data: "ontem" vira o dia anterior', () => {
  assert.equal(extrairDataDaMensagem('paguei 89 de uber ontem', HOJE), '2026-10-02');
});
test('data: "anteontem" vira dois dias antes', () => {
  assert.equal(extrairDataDaMensagem('gastei 10 anteontem', HOJE), '2026-10-01');
});
test('data: "dia 5 do mês passado" vira o dia 5 do mês anterior', () => {
  assert.equal(extrairDataDaMensagem('entrou 800 de aluguel dia 5 do mes passado', HOJE), '2026-09-05');
});
test('data: "dia 25" num dia 3 ainda não chegou, então é do mês passado', () => {
  assert.equal(extrairDataDaMensagem('paguei 50 dia 25', HOJE), '2026-09-25');
});
test('data: "dia 2" (já passou neste mês) fica no mês atual', () => {
  assert.equal(extrairDataDaMensagem('gastei 50 dia 2', HOJE), '2026-10-02');
});
test('data: dia inexistente no mês anterior é rejeitado, não vira outra data', () => {
  // setembro tem 30 dias: "dia 31 do mês passado" não existe.
  assert.equal(extrairDataDaMensagem('gastei 50 dia 31 do mes passado', HOJE), null);
});
test('data: mensagem sem data explícita não altera nada', () => {
  assert.equal(extrairDataDaMensagem('gastei 45 no mercado no pix', HOJE), null);
});
test('data: a data da IA é descartada e só vale a da mensagem', () => {
  const dados = { tipo: 'gasto', valor: 89, data: '2020-01-01' };
  aplicarDataDaMensagem(dados, 'paguei 89 de uber', HOJE);
  assert.equal(dados.data, null, 'sem data explícita, a data da IA não pode ser usada');
});
test('data: pendência mantém a data da primeira mensagem ao completar a resposta', () => {
  const dados = { tipo: 'gasto', valor: 45 };
  aplicarDataDaMensagem(dados, 'pix', HOJE, '2026-10-02');
  assert.equal(dados.data, '2026-10-02');
});
test('data: tipos sem data (meta, conta fixa) não recebem data', () => {
  const dados = { tipo: 'meta', valor_alvo: 5000 };
  aplicarDataDaMensagem(dados, 'quero juntar 5000 ontem', HOJE);
  assert.equal(dados.data, undefined);
});

test('nome: casa palavra inteira e ignora acento e maiúsculas', () => {
  assert.equal(mencionaNome('recarga de 200 no VR', 'VR'), true);
  assert.equal(mencionaNome('recarga de 200 no vr', 'VR'), true);
});
test('nome: não casa parte de outra palavra', () => {
  assert.equal(mencionaNome('comprei um tenis de 300', 'Ten'), false);
  assert.equal(mencionaNome('gastei 30 no pix', 'VR'), false);
});

test('cartão: "VR" não cadastrado não é trocado pelo Ticket', () => {
  const r = decidirCartaoAlimentacao({ cartao: 'Ticket', texto: 'recarga de 200 no VR', nomesCadastrados: ['Ticket'] });
  assert.equal(r.acao, 'perguntar');
});
test('cartão: nome digitado que ainda não existe é criado', () => {
  const r = decidirCartaoAlimentacao({ cartao: 'VR', texto: 'recarga de 200 no VR', nomesCadastrados: ['Ticket'] });
  assert.deepEqual(r, { acao: 'criar', nome: 'VR' });
});
test('cartão: nome citado e cadastrado é usado', () => {
  const r = decidirCartaoAlimentacao({ cartao: 'Ticket', texto: 'gastei 60 no ticket de lanche', nomesCadastrados: ['Ticket', 'VR'] });
  assert.deepEqual(r, { acao: 'usar', nome: 'Ticket' });
});
test('cartão: termo genérico ("vale") com um único cartão cadastrado usa esse cartão', () => {
  const r = decidirCartaoAlimentacao({ cartao: 'Ticket', texto: 'gastei 60 no vale', nomesCadastrados: ['Ticket'] });
  assert.deepEqual(r, { acao: 'usar', nome: 'Ticket' });
});
test('cartão: sem nome informado e com vários cadastrados, pergunta', () => {
  const r = decidirCartaoAlimentacao({ cartao: null, texto: 'gastei 60', nomesCadastrados: ['Ticket', 'VR'] });
  assert.equal(r.acao, 'perguntar');
});
test('cartão: sem nome informado e com um único cadastrado, usa esse', () => {
  const r = decidirCartaoAlimentacao({ cartao: null, texto: 'gastei 60', nomesCadastrados: ['Ticket'] });
  assert.deepEqual(r, { acao: 'usar', nome: 'Ticket' });
});

test('itens: mensagem com dois lançamentos devolve os dois', () => {
  const itens = itensDoLancamento({ itens: [{ tipo: 'gasto', valor: 25 }, { tipo: 'gasto', valor: 15 }] });
  assert.equal(itens.length, 2);
});
test('itens: sem lista, retorna null (fluxo normal)', () => {
  assert.equal(itensDoLancamento({ tipo: 'gasto', valor: 25 }), null);
  assert.equal(itensDoLancamento({ itens: [] }), null);
});
