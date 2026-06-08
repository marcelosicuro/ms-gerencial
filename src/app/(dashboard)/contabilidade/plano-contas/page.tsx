import { prisma } from "@/lib/prisma";
import { PlanoContasClient } from "./client";

type ContaRaw = {
  id: number;
  codigo: string;
  nome: string;
  tipo: import("@prisma/client").TipoConta;
  natureza: import("@prisma/client").NaturezaConta;
  paiId: number | null;
  ativo: boolean;
};

// Ordena hierarquicamente: pai antes dos filhos, mantendo ordem por código dentro de cada nível
function ordenarHierarquicamente(contas: ContaRaw[]) {
  const por_id = new Map(contas.map((c) => [c.id, c]));
  const resultado: (ContaRaw & { nivel: number })[] = [];
  const visitados = new Set<number>();

  function visitar(id: number, nivel: number) {
    if (visitados.has(id)) return;
    visitados.add(id);
    const c = por_id.get(id);
    if (!c) return;
    resultado.push({ ...c, nivel });
    filhosDe(c.id).forEach((f) => visitar(f.id, nivel + 1));
  }

  function filhosDe(paiId: number) {
    return contas
      .filter((c) => c.paiId === paiId)
      .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
  }

  // raízes (sem pai), ordenadas por código
  const raizes = contas
    .filter((c) => c.paiId === null)
    .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

  raizes.forEach((r) => visitar(r.id, 0));

  // contas órfãs (referência a pai inexistente) ficam no final
  contas
    .filter((c) => !visitados.has(c.id))
    .forEach((c) => resultado.push({ ...c, nivel: 0 }));

  return resultado;
}

export default async function PlanoContasPage() {
  let contas: ContaRaw[] = [];
  try {
    contas = await prisma.planoContas.findMany({ orderBy: { codigo: "asc" } });
  } catch {
    // DB não configurado ainda — exibe lista vazia
  }

  const contasOrdenadas = ordenarHierarquicamente(contas);

  return (
    <div className="space-y-6">
      <PlanoContasClient contas={contasOrdenadas} />
    </div>
  );
}
