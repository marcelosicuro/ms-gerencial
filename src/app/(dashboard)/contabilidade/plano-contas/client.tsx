"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanoContasForm } from "./form";
import { AcoesConta } from "./acoes";
import type { Conta, ContaComNivel } from "./types";
import { TipoConta, NaturezaConta } from "@prisma/client";
import { cn } from "@/lib/utils";

const naturezaVariant: Record<NaturezaConta, "default" | "secondary" | "outline" | "destructive"> = {
  ATIVO:              "default",
  PASSIVO:            "secondary",
  PATRIMONIO_LIQUIDO: "outline",
  RECEITA:            "default",
  CUSTO:              "destructive",
  DESPESA:            "destructive",
};

const naturezaLabel: Record<NaturezaConta, string> = {
  ATIVO:              "Ativo",
  PASSIVO:            "Passivo",
  PATRIMONIO_LIQUIDO: "PL",
  RECEITA:            "Receita",
  CUSTO:              "Custo",
  DESPESA:            "Despesa",
};

export function PlanoContasClient({ contas }: { contas: ContaComNivel[] }) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Conta | null>(null);

  function abrirNova() {
    setEditando(null);
    setOpen(true);
  }

  function abrirEditar(c: Conta) {
    setEditando(c);
    setOpen(true);
  }

  const contasPai = contas
    .filter((c) => c.tipo === TipoConta.SINTETICA && c.ativo)
    .map((c) => ({ id: c.id, codigo: c.codigo, nome: c.nome }));

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-muted-foreground text-sm">{contas.length} contas cadastradas</p>
        </div>
        <Button onClick={abrirNova}>
          <Plus className="h-4 w-4 mr-2" />
          Nova conta
        </Button>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium w-32">Código</th>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium w-32">Tipo</th>
              <th className="text-left px-4 py-3 font-medium w-28">Natureza</th>
              <th className="text-left px-4 py-3 font-medium w-20">Status</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {contas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted-foreground py-12">
                  Nenhuma conta cadastrada.{" "}
                  <button className="underline text-primary" onClick={abrirNova}>
                    Criar a primeira conta
                  </button>
                </td>
              </tr>
            )}
            {contas.map((c) => (
              <tr
                key={c.id}
                className={cn("hover:bg-muted/30 transition-colors", !c.ativo && "opacity-50")}
              >
                <td className="px-4 py-2.5 font-mono text-sm">{c.codigo}</td>
                <td className="px-4 py-2.5">
                  <span
                    style={{ paddingLeft: `${c.nivel * 20}px` }}
                    className={cn(
                      "flex items-center gap-1.5",
                      c.tipo === TipoConta.SINTETICA && "font-semibold"
                    )}
                  >
                    {c.nivel > 0 && <span className="text-muted-foreground text-xs">↳</span>}
                    {c.nome}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className="text-xs">
                    {c.tipo === TipoConta.SINTETICA ? "Sintética" : "Analítica"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={naturezaVariant[c.natureza]} className="text-xs">
                    {naturezaLabel[c.natureza]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("text-xs font-medium", c.ativo ? "text-green-600" : "text-muted-foreground")}>
                    {c.ativo ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <AcoesConta conta={c} onEditar={abrirEditar} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PlanoContasForm
        open={open}
        onOpenChange={setOpen}
        conta={editando}
        contasPai={contasPai}
      />
    </>
  );
}
