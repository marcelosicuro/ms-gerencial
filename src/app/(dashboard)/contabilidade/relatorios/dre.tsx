import { calcularSaldos, type SaldoConta } from "@/lib/contabilidade";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function LinhaGrupo({ label, contas, sinal = 1 }: { label: string; contas: SaldoConta[]; sinal?: number }) {
  const total = contas.reduce((s, c) => s + c.saldo, 0) * sinal;
  return (
    <>
      <tr className="bg-muted/40">
        <td colSpan={2} className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </td>
        <td className="px-4 py-2 text-right font-semibold tabular-nums">
          {fmt.format(total)}
        </td>
      </tr>
      {contas.map((c) => (
        <tr key={c.id} className="hover:bg-muted/20 border-b last:border-0">
          <td className="px-4 py-2 font-mono text-xs text-muted-foreground pl-8 w-32">{c.codigo}</td>
          <td className="px-4 py-2 text-sm">{c.nome}</td>
          <td className="px-4 py-2 text-right text-sm tabular-nums">{fmt.format(c.saldo * sinal)}</td>
        </tr>
      ))}
    </>
  );
}

function LinhaResultado({ label, valor, destaque = false }: { label: string; valor: number; destaque?: boolean }) {
  const cor = valor >= 0 ? "text-green-700" : "text-red-600";
  return (
    <tr className={destaque ? "border-t-2 border-foreground" : "border-t"}>
      <td colSpan={2} className={`px-4 py-3 font-bold ${destaque ? "text-base" : "text-sm"}`}>{label}</td>
      <td className={`px-4 py-3 text-right font-bold tabular-nums ${cor} ${destaque ? "text-base" : "text-sm"}`}>
        {fmt.format(valor)}
      </td>
    </tr>
  );
}

export async function DRE({ inicio, fim }: { inicio: Date; fim: Date }) {
  let receitas: SaldoConta[]  = [];
  let custos: SaldoConta[]    = [];
  let despesas: SaldoConta[]  = [];

  try {
    [receitas, custos, despesas] = await Promise.all([
      calcularSaldos(inicio, fim, ["RECEITA"]),
      calcularSaldos(inicio, fim, ["CUSTO"]),
      calcularSaldos(inicio, fim, ["DESPESA"]),
    ]);
  } catch { /* DB não configurado */ }

  const totalReceitas  = receitas.reduce((s, c) => s + c.saldo, 0);
  const totalCustos    = custos.reduce((s, c) => s + c.saldo, 0);
  const lucroBruto     = totalReceitas - totalCustos;
  const totalDespesas  = despesas.reduce((s, c) => s + c.saldo, 0);
  const resultadoLiquidо = lucroBruto - totalDespesas;

  const vazio = receitas.length + custos.length + despesas.length === 0;

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Demonstração do Resultado do Exercício
        </p>
      </div>
      {vazio ? (
        <p className="text-center text-muted-foreground py-12 text-sm">
          Nenhum lançamento encontrado no período.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-32">Código</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Conta</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground w-40">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {receitas.length > 0 && <LinhaGrupo label="(+) Receitas" contas={receitas} />}
            {custos.length > 0   && <LinhaGrupo label="(–) Custo dos produtos/serviços" contas={custos} />}
            <LinhaResultado label="Lucro Bruto" valor={lucroBruto} />
            {despesas.length > 0 && <LinhaGrupo label="(–) Despesas operacionais" contas={despesas} />}
            <LinhaResultado label="Resultado Líquido" valor={resultadoLiquidо} destaque />
          </tbody>
        </table>
      )}
    </div>
  );
}
