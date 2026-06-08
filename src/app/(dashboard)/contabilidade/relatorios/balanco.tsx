import { calcularSaldos, type SaldoConta } from "@/lib/contabilidade";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function GrupoContas({ titulo, contas }: { titulo: string; contas: SaldoConta[] }) {
  const total = contas.reduce((s, c) => s + c.saldo, 0);
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center px-4 py-2 bg-muted/40">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</span>
        <span className="font-semibold tabular-nums text-sm">{fmt.format(total)}</span>
      </div>
      {contas.map((c) => (
        <div key={c.id} className="flex justify-between items-center px-4 py-1.5 border-b last:border-0 hover:bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground w-20">{c.codigo}</span>
            <span className="text-sm">{c.nome}</span>
          </div>
          <span className="text-sm tabular-nums">{fmt.format(c.saldo)}</span>
        </div>
      ))}
      {contas.length === 0 && (
        <p className="text-xs text-muted-foreground px-4 py-2 italic">Sem movimentação</p>
      )}
    </div>
  );
}

function TotalGeral({ label, valor, ok }: { label: string; valor: number; ok: boolean }) {
  return (
    <div className={`flex justify-between items-center px-4 py-3 border-t-2 ${ok ? "border-green-600" : "border-red-500"}`}>
      <span className="font-bold">{label}</span>
      <span className={`font-bold text-lg tabular-nums ${ok ? "text-green-700" : "text-red-600"}`}>
        {fmt.format(valor)}
      </span>
    </div>
  );
}

export async function Balanco({ inicio, fim }: { inicio: Date; fim: Date }) {
  let ativo: SaldoConta[] = [];
  let passivo: SaldoConta[] = [];
  let pl: SaldoConta[] = [];

  try {
    [ativo, passivo, pl] = await Promise.all([
      calcularSaldos(inicio, fim, ["ATIVO"]),
      calcularSaldos(inicio, fim, ["PASSIVO"]),
      calcularSaldos(inicio, fim, ["PATRIMONIO_LIQUIDO"]),
    ]);
  } catch { /* DB não configurado */ }

  const totalAtivo    = ativo.reduce((s, c) => s + c.saldo, 0);
  const totalPassivo  = passivo.reduce((s, c) => s + c.saldo, 0);
  const totalPL       = pl.reduce((s, c) => s + c.saldo, 0);
  const totalPassPL   = totalPassivo + totalPL;
  const equilibrado   = Math.abs(totalAtivo - totalPassPL) < 0.01;

  const vazio = ativo.length + passivo.length + pl.length === 0;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ATIVO */}
      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b bg-blue-50 dark:bg-blue-950/20">
          <p className="text-xs uppercase tracking-wide font-semibold text-blue-700 dark:text-blue-400">Ativo</p>
        </div>
        {vazio
          ? <p className="text-center text-muted-foreground py-8 text-sm">Sem movimentação</p>
          : <GrupoContas titulo="Bens e Direitos" contas={ativo} />
        }
        <TotalGeral label="Total do Ativo" valor={totalAtivo} ok={equilibrado} />
      </div>

      {/* PASSIVO + PL */}
      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b bg-orange-50 dark:bg-orange-950/20">
          <p className="text-xs uppercase tracking-wide font-semibold text-orange-700 dark:text-orange-400">Passivo + Patrimônio Líquido</p>
        </div>
        {vazio
          ? <p className="text-center text-muted-foreground py-8 text-sm">Sem movimentação</p>
          : (
            <>
              <GrupoContas titulo="Passivo" contas={passivo} />
              <GrupoContas titulo="Patrimônio Líquido" contas={pl} />
            </>
          )
        }
        <TotalGeral label="Total Passivo + PL" valor={totalPassPL} ok={equilibrado} />
      </div>

      {!equilibrado && !vazio && (
        <div className="lg:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          ⚠ Balanço desequilibrado: diferença de {fmt.format(Math.abs(totalAtivo - totalPassPL))}.
          Verifique se todos os lançamentos estão com partidas dobradas corretas.
        </div>
      )}
    </div>
  );
}
