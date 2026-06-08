"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanoContasForm } from "./form";
import { TreeNode } from "./tree-node";
import type { Conta, ContaNode } from "./types";

function coletarSinteticas(nos: ContaNode[]): { id: number; codigo: string; nome: string }[] {
  const result: { id: number; codigo: string; nome: string }[] = [];
  function percorrer(lista: ContaNode[]) {
    for (const n of lista) {
      if (n.tipo === "SINTETICA") result.push({ id: n.id, codigo: n.codigo, nome: n.nome });
      percorrer(n.filhos);
    }
  }
  percorrer(nos);
  return result;
}

type Estado =
  | { modo: "fechado" }
  | { modo: "nova-raiz" }
  | { modo: "nova-filha"; pai: Conta }
  | { modo: "editar"; conta: Conta };

export function PlanoContasClient({ tree, total }: { tree: ContaNode[]; total: number }) {
  const [estado, setEstado] = useState<Estado>({ modo: "fechado" });

  const contasPai = coletarSinteticas(tree);

  const open = estado.modo !== "fechado";
  const conta = estado.modo === "editar" ? estado.conta : null;
  const paiInicial = estado.modo === "nova-filha" ? estado.pai : null;

  function fechar() { setEstado({ modo: "fechado" }); }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-muted-foreground text-sm">{total} contas cadastradas</p>
        </div>
        <Button onClick={() => setEstado({ modo: "nova-raiz" })}>
          <Plus className="h-4 w-4 mr-2" />
          Nova conta raiz
        </Button>
      </div>

      <div className="rounded-lg border bg-background p-2">
        {tree.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">
            Nenhuma conta cadastrada.{" "}
            <button
              className="underline text-primary"
              onClick={() => setEstado({ modo: "nova-raiz" })}
            >
              Criar a primeira conta
            </button>
          </p>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              onEditar={(c) => setEstado({ modo: "editar", conta: c })}
              onAdicionarFilha={(pai) => setEstado({ modo: "nova-filha", pai })}
            />
          ))
        )}
      </div>

      <PlanoContasForm
        open={open}
        onOpenChange={(v) => { if (!v) fechar(); }}
        conta={conta}
        paiInicial={paiInicial}
        contasPai={contasPai}
      />
    </>
  );
}
