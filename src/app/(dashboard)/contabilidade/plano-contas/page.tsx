import { prisma } from "@/lib/prisma";
import { PlanoContasClient } from "./client";
import type { ContaNode } from "./types";

type ContaRaw = {
  id: number;
  codigo: string;
  nome: string;
  tipo: import("@prisma/client").TipoConta;
  natureza: import("@prisma/client").NaturezaConta;
  paiId: number | null;
  ativo: boolean;
};

function buildTree(contas: ContaRaw[]): ContaNode[] {
  const map = new Map<number, ContaNode>();
  for (const c of contas) map.set(c.id, { ...c, filhos: [] });

  const roots: ContaNode[] = [];
  for (const node of map.values()) {
    if (node.paiId === null || !map.has(node.paiId)) {
      roots.push(node);
    } else {
      map.get(node.paiId)!.filhos.push(node);
    }
  }

  function sort(nodes: ContaNode[]) {
    nodes.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
    nodes.forEach((n) => sort(n.filhos));
  }
  sort(roots);
  return roots;
}

function contarTotal(nos: ContaNode[]): number {
  return nos.reduce((acc, n) => acc + 1 + contarTotal(n.filhos), 0);
}

export default async function PlanoContasPage() {
  let contas: ContaRaw[] = [];
  try {
    contas = await prisma.planoContas.findMany({ orderBy: { codigo: "asc" } });
  } catch {
    // DB não configurado ainda
  }

  const tree = buildTree(contas);
  const total = contarTotal(tree);

  return (
    <div className="space-y-6">
      <PlanoContasClient tree={tree} total={total} />
    </div>
  );
}
