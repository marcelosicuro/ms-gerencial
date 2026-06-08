"use client";

import { useState, useTransition } from "react";
import {
  ChevronRight, ChevronDown,
  Folder, FolderOpen, FileText,
  Plus, Pencil, Power, PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { alternarAtivo } from "@/app/actions/plano-contas";
import { toast } from "sonner";
import type { ContaNode, Conta } from "./types";
import { NaturezaConta } from "@prisma/client";

const naturezaCor: Record<NaturezaConta, string> = {
  ATIVO:              "bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300",
  PASSIVO:            "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  PATRIMONIO_LIQUIDO: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  RECEITA:            "bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300",
  CUSTO:              "bg-red-100    text-red-800    dark:bg-red-900/40    dark:text-red-300",
  DESPESA:            "bg-rose-100   text-rose-800   dark:bg-rose-900/40   dark:text-rose-300",
};

const naturezaLabel: Record<NaturezaConta, string> = {
  ATIVO: "Ativo", PASSIVO: "Passivo", PATRIMONIO_LIQUIDO: "PL",
  RECEITA: "Receita", CUSTO: "Custo", DESPESA: "Despesa",
};

type Props = {
  node: ContaNode;
  depth?: number;
  onEditar: (c: Conta) => void;
  onAdicionarFilha: (pai: Conta) => void;
};

export function TreeNode({ node, depth = 0, onEditar, onAdicionarFilha }: Props) {
  const [expandido, setExpandido] = useState(true);
  const [pending, startTransition] = useTransition();

  const temFilhos = node.filhos.length > 0;
  const isSintetica = node.tipo === "SINTETICA";

  function toggleAtivo() {
    startTransition(async () => {
      const result = await alternarAtivo(node.id, !node.ativo);
      if (!result.ok) toast.error(result.error);
      else toast.success(node.ativo ? "Conta desativada." : "Conta reativada.");
    });
  }

  const conta: Conta = {
    id: node.id, codigo: node.codigo, nome: node.nome,
    tipo: node.tipo, natureza: node.natureza, paiId: node.paiId, ativo: node.ativo,
  };

  return (
    <div>
      {/* Linha do nó */}
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors",
          "hover:bg-muted/50",
          !node.ativo && "opacity-40"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Chevron expand/collapse */}
        <button
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors",
            temFilhos ? "hover:text-foreground" : "cursor-default"
          )}
          onClick={() => temFilhos && setExpandido((v) => !v)}
          tabIndex={temFilhos ? 0 : -1}
        >
          {temFilhos
            ? expandido
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />
            : <span className="h-3.5 w-3.5" />}
        </button>

        {/* Ícone de pasta/arquivo */}
        <span className="shrink-0 text-muted-foreground">
          {isSintetica
            ? expandido && temFilhos
              ? <FolderOpen className="h-4 w-4 text-amber-500" />
              : <Folder className="h-4 w-4 text-amber-500" />
            : <FileText className="h-3.5 w-3.5" />}
        </span>

        {/* Código */}
        <span className="shrink-0 w-20 font-mono text-xs text-muted-foreground">{node.codigo}</span>

        {/* Nome */}
        <span className={cn("flex-1 truncate", isSintetica && "font-semibold")}>
          {node.nome}
        </span>

        {/* Badge natureza */}
        <span className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
          naturezaCor[node.natureza]
        )}>
          {naturezaLabel[node.natureza]}
        </span>

        {/* Ações — visíveis ao hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => onEditar(conta)}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {isSintetica && (
            <Button
              size="icon" variant="ghost" className="h-7 w-7 text-primary"
              onClick={() => onAdicionarFilha(conta)}
              title="Adicionar conta filha"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="icon" variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={toggleAtivo} disabled={pending}
            title={node.ativo ? "Desativar" : "Reativar"}
          >
            {node.ativo
              ? <PowerOff className="h-3.5 w-3.5" />
              : <Power className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Filhos */}
      {temFilhos && expandido && (
        <div>
          {node.filhos.map((filho) => (
            <TreeNode
              key={filho.id}
              node={filho}
              depth={depth + 1}
              onEditar={onEditar}
              onAdicionarFilha={onAdicionarFilha}
            />
          ))}
        </div>
      )}
    </div>
  );
}
