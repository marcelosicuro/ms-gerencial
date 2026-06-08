import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { SeletorConta } from "./seletor-conta";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: Date) => new Date(d).toLocaleDateString("pt-BR");

type Lancamento = {
  id: number;
  data: Date;
  descricao: string;
  valor: number;
  documento: string | null;
  lado: "D" | "C";
  contrapartida: string;
};

async function getLancamentosConta(contaId: number, inicio: Date, fim: Date): Promise<Lancamento[]> {
  const [debitos, creditos] = await Promise.all([
    prisma.lancamento.findMany({
      where: { debitoId: contaId, data: { gte: inicio, lte: fim } },
      orderBy: { data: "asc" },
      include: { credito: { select: { codigo: true, nome: true } } },
    }),
    prisma.lancamento.findMany({
      where: { creditoId: contaId, data: { gte: inicio, lte: fim } },
      orderBy: { data: "asc" },
      include: { debito: { select: { codigo: true, nome: true } } },
    }),
  ]);

  const resultado: Lancamento[] = [
    ...debitos.map((l) => ({
      id: l.id, data: l.data, descricao: l.descricao,
      valor: Number(l.valor), documento: l.documento, lado: "D" as const,
      contrapartida: `${l.credito.codigo} — ${l.credito.nome}`,
    })),
    ...creditos.map((l) => ({
      id: l.id, data: l.data, descricao: l.descricao,
      valor: Number(l.valor), documento: l.documento, lado: "C" as const,
      contrapartida: `${l.debito.codigo} — ${l.debito.nome}`,
    })),
  ];

  return resultado.sort((a, b) => a.data.getTime() - b.data.getTime() || a.id - b.id);
}

type Props = {
  inicio: Date;
  fim: Date;
  contaId: number | null;
};

export async function Razao({ inicio, fim, contaId }: Props) {
  let contas: { id: number; codigo: string; nome: string }[] = [];
  let lancamentos: Lancamento[] = [];

  const url = process.env.DATABASE_URL ?? "";
  const dbOk = !!url && url.startsWith("postgresql://");

  if (dbOk) {
    try {
      contas = await prisma.planoContas.findMany({
        where:   { tipo: "ANALITICA", ativo: true },
        orderBy: { codigo: "asc" },
        select:  { id: true, codigo: true, nome: true },
      });

      if (contaId) {
        lancamentos = await getLancamentosConta(contaId, inicio, fim);
      }
    } catch { /* DB indisponível */ }
  }

  const totalDebito  = lancamentos.filter((l) => l.lado === "D").reduce((s, l) => s + l.valor, 0);
  const totalCredito = lancamentos.filter((l) => l.lado === "C").reduce((s, l) => s + l.valor, 0);
  const contaSel     = contas.find((c) => c.id === contaId);

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <SeletorConta contas={contas} contaId={contaId} />
      </div>

      {!contaId && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Selecione uma conta analítica para ver o razão.
        </p>
      )}

      {contaId && (
        <div className="rounded-lg border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Razão contábil</p>
              {contaSel && (
                <p className="font-semibold text-sm mt-0.5">
                  {contaSel.codigo} — {contaSel.nome}
                </p>
              )}
            </div>
            <div className="flex gap-4 text-sm">
              <span>Débitos: <span className="font-mono font-medium">{fmt.format(totalDebito)}</span></span>
              <span>Créditos: <span className="font-mono font-medium">{fmt.format(totalCredito)}</span></span>
            </div>
          </div>

          {lancamentos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhum lançamento nesta conta no período.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground w-28">Data</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Contrapartida</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground w-12">D/C</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground w-36">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lancamentos.map((l) => (
                  <tr key={`${l.id}-${l.lado}`} className="hover:bg-muted/20">
                    <td className="px-4 py-2 tabular-nums">{fmtDate(l.data)}</td>
                    <td className="px-4 py-2">
                      {l.descricao}
                      {l.documento && (
                        <Badge variant="outline" className="ml-2 text-xs">{l.documento}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{l.contrapartida}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
                        l.lado === "D"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {l.lado}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt.format(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
