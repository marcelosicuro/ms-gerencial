import { prisma } from "@/lib/prisma";
import type { NaturezaConta } from "@prisma/client";

export type SaldoConta = {
  id: number;
  codigo: string;
  nome: string;
  natureza: NaturezaConta;
  // saldo positivo = aumento na natureza da conta
  saldo: number;
  totalDebito: number;
  totalCredito: number;
};

/**
 * Calcula o saldo de cada conta analítica no período.
 * Regra de partidas dobradas:
 *   - Contas de natureza DEVEDORA (Ativo, Custo, Despesa): saldo = débitos – créditos
 *   - Contas de natureza CREDORA  (Passivo, PL, Receita):  saldo = créditos – débitos
 */
function dbConfigurado(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return !!url && url.startsWith("postgresql://");
}

export async function calcularSaldos(
  inicio: Date,
  fim: Date,
  naturezas?: NaturezaConta[]
): Promise<SaldoConta[]> {
  if (!dbConfigurado()) return [];

  const contas = await prisma.planoContas.findMany({
    where: {
      tipo:     "ANALITICA",
      ativo:    true,
      ...(naturezas ? { natureza: { in: naturezas } } : {}),
    },
    orderBy: { codigo: "asc" },
  });

  if (contas.length === 0) return [];

  const ids = contas.map((c) => c.id);

  // soma dos débitos por conta
  const debitos = await prisma.lancamento.groupBy({
    by: ["debitoId"],
    where: { debitoId: { in: ids }, data: { gte: inicio, lte: fim } },
    _sum: { valor: true },
  });

  // soma dos créditos por conta
  const creditos = await prisma.lancamento.groupBy({
    by: ["creditoId"],
    where: { creditoId: { in: ids }, data: { gte: inicio, lte: fim } },
    _sum: { valor: true },
  });

  const mapDebito  = new Map(debitos.map((r)  => [r.debitoId,  Number(r._sum.valor ?? 0)]));
  const mapCredito = new Map(creditos.map((r) => [r.creditoId, Number(r._sum.valor ?? 0)]));

  const NATUREZA_DEVEDORA = new Set<NaturezaConta>(["ATIVO", "CUSTO", "DESPESA"]);

  return contas
    .map((c) => {
      const d = mapDebito.get(c.id)  ?? 0;
      const cr = mapCredito.get(c.id) ?? 0;
      const saldo = NATUREZA_DEVEDORA.has(c.natureza) ? d - cr : cr - d;
      return { id: c.id, codigo: c.codigo, nome: c.nome, natureza: c.natureza, saldo, totalDebito: d, totalCredito: cr };
    })
    .filter((c) => c.saldo !== 0 || c.totalDebito !== 0 || c.totalCredito !== 0);
}

export function parsePeriodo(searchParams: { [k: string]: string | string[] | undefined }) {
  const hoje = new Date();
  const ano  = Number(searchParams.ano  ?? hoje.getFullYear());
  const mes  = searchParams.mes ? Number(searchParams.mes) : null;

  const inicio = mes
    ? new Date(ano, mes - 1, 1)
    : new Date(ano, 0, 1);

  const fim = mes
    ? new Date(ano, mes, 0, 23, 59, 59)   // último dia do mês
    : new Date(ano, 11, 31, 23, 59, 59);

  return { inicio, fim, ano, mes };
}
