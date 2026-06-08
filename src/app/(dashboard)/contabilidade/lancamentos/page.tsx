import { prisma } from "@/lib/prisma";
import { LancamentosClient } from "./client";
import type { LancamentoListItem, ContaOpcao, CentroCustoOpcao } from "./types";

export default async function LancamentosPage() {
  let lancamentos: LancamentoListItem[] = [];
  let contas: ContaOpcao[] = [];
  let centrosCusto: CentroCustoOpcao[] = [];

  try {
    [lancamentos, contas, centrosCusto] = await Promise.all([
      prisma.lancamento.findMany({
        orderBy: { data: "desc" },
        take: 100,
        include: {
          debito:      { select: { id: true, codigo: true, nome: true } },
          credito:     { select: { id: true, codigo: true, nome: true } },
          centroCusto: { select: { nome: true } },
          lancadoPor:  { select: { nome: true, email: true } },
        },
      }).then((rows) =>
        rows.map((r) => ({
          ...r,
          valor: Number(r.valor),
        }))
      ),
      prisma.planoContas.findMany({
        where:   { tipo: "ANALITICA", ativo: true },
        orderBy: { codigo: "asc" },
        select:  { id: true, codigo: true, nome: true },
      }),
      prisma.centroCusto.findMany({
        where:   { ativo: true },
        orderBy: { nome: "asc" },
        select:  { id: true, nome: true },
      }),
    ]);
  } catch {
    // DB não configurado — exibe tudo vazio
  }

  return (
    <div className="space-y-6">
      <LancamentosClient
        lancamentos={lancamentos}
        contas={contas}
        centrosCusto={centrosCusto}
      />
    </div>
  );
}
