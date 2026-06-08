import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  // perfil dev
  await prisma.profile.upsert({
    where:  { id: DEV_USER_ID },
    update: {},
    create: { id: DEV_USER_ID, email: "dev@local", nome: "Dev Local", role: "ADMIN" },
  });

  // ── Plano de contas básico ────────────────────────────────────────────────
  const contas = [
    // ATIVO
    { codigo: "1",       nome: "ATIVO",                    tipo: "SINTETICA", natureza: "ATIVO",              paiId: null },
    { codigo: "1.1",     nome: "Ativo Circulante",          tipo: "SINTETICA", natureza: "ATIVO",              pai: "1" },
    { codigo: "1.1.01",  nome: "Caixa",                     tipo: "ANALITICA", natureza: "ATIVO",              pai: "1.1" },
    { codigo: "1.1.02",  nome: "Banco Conta Corrente",      tipo: "ANALITICA", natureza: "ATIVO",              pai: "1.1" },
    { codigo: "1.1.03",  nome: "Clientes a Receber",        tipo: "ANALITICA", natureza: "ATIVO",              pai: "1.1" },
    { codigo: "1.1.04",  nome: "Estoque de Mercadorias",    tipo: "ANALITICA", natureza: "ATIVO",              pai: "1.1" },
    // PASSIVO
    { codigo: "2",       nome: "PASSIVO",                   tipo: "SINTETICA", natureza: "PASSIVO",            paiId: null },
    { codigo: "2.1",     nome: "Passivo Circulante",        tipo: "SINTETICA", natureza: "PASSIVO",            pai: "2" },
    { codigo: "2.1.01",  nome: "Fornecedores a Pagar",      tipo: "ANALITICA", natureza: "PASSIVO",            pai: "2.1" },
    { codigo: "2.1.02",  nome: "Salários a Pagar",          tipo: "ANALITICA", natureza: "PASSIVO",            pai: "2.1" },
    { codigo: "2.1.03",  nome: "Impostos a Recolher",       tipo: "ANALITICA", natureza: "PASSIVO",            pai: "2.1" },
    // PL
    { codigo: "3",       nome: "PATRIMÔNIO LÍQUIDO",        tipo: "SINTETICA", natureza: "PATRIMONIO_LIQUIDO", paiId: null },
    { codigo: "3.1.01",  nome: "Capital Social",            tipo: "ANALITICA", natureza: "PATRIMONIO_LIQUIDO", pai: "3" },
    { codigo: "3.1.02",  nome: "Lucros Acumulados",         tipo: "ANALITICA", natureza: "PATRIMONIO_LIQUIDO", pai: "3" },
    // RECEITA
    { codigo: "4",       nome: "RECEITAS",                  tipo: "SINTETICA", natureza: "RECEITA",            paiId: null },
    { codigo: "4.1.01",  nome: "Receita de Vendas",         tipo: "ANALITICA", natureza: "RECEITA",            pai: "4" },
    { codigo: "4.1.02",  nome: "Receita de Serviços",       tipo: "ANALITICA", natureza: "RECEITA",            pai: "4" },
    // CUSTO
    { codigo: "5",       nome: "CUSTOS",                    tipo: "SINTETICA", natureza: "CUSTO",              paiId: null },
    { codigo: "5.1.01",  nome: "Custo das Mercadorias",     tipo: "ANALITICA", natureza: "CUSTO",              pai: "5" },
    { codigo: "5.1.02",  nome: "Custo dos Serviços",        tipo: "ANALITICA", natureza: "CUSTO",              pai: "5" },
    // DESPESA
    { codigo: "6",       nome: "DESPESAS",                  tipo: "SINTETICA", natureza: "DESPESA",            paiId: null },
    { codigo: "6.1.01",  nome: "Salários e Encargos",       tipo: "ANALITICA", natureza: "DESPESA",            pai: "6" },
    { codigo: "6.1.02",  nome: "Aluguel",                   tipo: "ANALITICA", natureza: "DESPESA",            pai: "6" },
    { codigo: "6.1.03",  nome: "Energia Elétrica",          tipo: "ANALITICA", natureza: "DESPESA",            pai: "6" },
    { codigo: "6.1.04",  nome: "Marketing e Publicidade",   tipo: "ANALITICA", natureza: "DESPESA",            pai: "6" },
  ] as const;

  // upsert das contas (duas passagens: raízes primeiro, depois filhos)
  const idMap = new Map<string, number>();

  for (const c of contas) {
    const paiId = "pai" in c && c.pai ? (idMap.get(c.pai) ?? null) : null;
    const criada = await prisma.planoContas.upsert({
      where:  { codigo: c.codigo },
      update: { nome: c.nome },
      create: {
        codigo:   c.codigo,
        nome:     c.nome,
        tipo:     c.tipo as "SINTETICA" | "ANALITICA",
        natureza: c.natureza as "ATIVO"|"PASSIVO"|"PATRIMONIO_LIQUIDO"|"RECEITA"|"CUSTO"|"DESPESA",
        paiId,
      },
    });
    idMap.set(c.codigo, criada.id);
  }

  // centro de custo
  const cc = await prisma.centroCusto.upsert({
    where:  { codigo: "ADM" },
    update: {},
    create: { codigo: "ADM", nome: "Administrativo" },
  });

  // ── Lançamentos de exemplo (ano corrente) ────────────────────────────────
  const ano = new Date().getFullYear();

  const get = (codigo: string) => {
    const id = idMap.get(codigo);
    if (!id) throw new Error(`Conta não encontrada: ${codigo}`);
    return id;
  };

  const exemplos = [
    // Capital integralizado
    { data: new Date(ano, 0, 2),  descricao: "Integralização de capital",     valor: 50000, debitoId: get("1.1.02"), creditoId: get("3.1.01"), doc: null },
    // Receita de vendas
    { data: new Date(ano, 0, 10), descricao: "Venda de mercadorias - Jan",    valor: 12000, debitoId: get("1.1.02"), creditoId: get("4.1.01"), doc: "NF-001" },
    { data: new Date(ano, 1, 10), descricao: "Venda de mercadorias - Fev",    valor: 14500, debitoId: get("1.1.02"), creditoId: get("4.1.01"), doc: "NF-002" },
    { data: new Date(ano, 2, 10), descricao: "Venda de mercadorias - Mar",    valor: 18000, debitoId: get("1.1.02"), creditoId: get("4.1.01"), doc: "NF-003" },
    { data: new Date(ano, 2, 15), descricao: "Receita de serviços - Mar",     valor:  3500, debitoId: get("1.1.02"), creditoId: get("4.1.02"), doc: "OS-001" },
    // CMV
    { data: new Date(ano, 0, 10), descricao: "CMV - Jan",                     valor:  7200, debitoId: get("5.1.01"), creditoId: get("1.1.04"), doc: null },
    { data: new Date(ano, 1, 10), descricao: "CMV - Fev",                     valor:  8700, debitoId: get("5.1.01"), creditoId: get("1.1.04"), doc: null },
    { data: new Date(ano, 2, 10), descricao: "CMV - Mar",                     valor: 10800, debitoId: get("5.1.01"), creditoId: get("1.1.04"), doc: null },
    // Despesas
    { data: new Date(ano, 0, 31), descricao: "Folha de pagamento - Jan",      valor:  8000, debitoId: get("6.1.01"), creditoId: get("2.1.02"), doc: null },
    { data: new Date(ano, 1, 28), descricao: "Folha de pagamento - Fev",      valor:  8000, debitoId: get("6.1.01"), creditoId: get("2.1.02"), doc: null },
    { data: new Date(ano, 2, 31), descricao: "Folha de pagamento - Mar",      valor:  8000, debitoId: get("6.1.01"), creditoId: get("2.1.02"), doc: null },
    { data: new Date(ano, 0,  5), descricao: "Aluguel - Jan",                 valor:  3500, debitoId: get("6.1.02"), creditoId: get("2.1.01"), doc: "REC-01" },
    { data: new Date(ano, 1,  5), descricao: "Aluguel - Fev",                 valor:  3500, debitoId: get("6.1.02"), creditoId: get("2.1.01"), doc: "REC-02" },
    { data: new Date(ano, 2,  5), descricao: "Aluguel - Mar",                 valor:  3500, debitoId: get("6.1.02"), creditoId: get("2.1.01"), doc: "REC-03" },
    { data: new Date(ano, 2, 20), descricao: "Energia elétrica - Mar",        valor:   420, debitoId: get("6.1.03"), creditoId: get("2.1.01"), doc: null },
  ];

  await prisma.lancamento.deleteMany({});
  for (const l of exemplos) {
    await prisma.lancamento.create({
      data: {
        data:          l.data,
        descricao:     l.descricao,
        valor:         l.valor,
        debitoId:      l.debitoId,
        creditoId:     l.creditoId,
        centroCustoId: cc.id,
        documento:     l.doc,
        lancadoPorId:  DEV_USER_ID,
      },
    });
  }

  console.log("✓ Seed concluído:", exemplos.length, "lançamentos criados");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
