"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LancamentosForm } from "./form";
import { excluirLancamento } from "@/app/actions/lancamentos";
import type { LancamentoListItem, ContaOpcao, CentroCustoOpcao } from "./types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: Date) => new Date(d).toLocaleDateString("pt-BR");

type Props = {
  lancamentos: LancamentoListItem[];
  contas: ContaOpcao[];
  centrosCusto: CentroCustoOpcao[];
};

export function LancamentosClient({ lancamentos, contas, centrosCusto }: Props) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<LancamentoListItem | null>(null);
  const [excluindo, setExcluindo] = useState<LancamentoListItem | null>(null);
  const [pending, startTransition] = useTransition();

  function abrirNovo() {
    setEditando(null);
    setOpen(true);
  }

  function abrirEditar(l: LancamentoListItem) {
    setEditando(l);
    setOpen(true);
  }

  function confirmarExclusao() {
    if (!excluindo) return;
    startTransition(async () => {
      const result = await excluirLancamento(excluindo.id);
      if (result.ok) toast.success("Lançamento excluído.");
      else toast.error("Erro ao excluir.");
      setExcluindo(null);
    });
  }

  const totalDebitos = lancamentos.reduce((s, l) => s + l.valor, 0);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lançamentos</h1>
          <p className="text-muted-foreground text-sm">
            {lancamentos.length} lançamentos · total {fmt.format(totalDebitos)}
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4 mr-2" />
          Novo lançamento
        </Button>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium w-28">Data</th>
              <th className="text-left px-4 py-3 font-medium">Descrição</th>
              <th className="text-left px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-xs bg-blue-100 text-blue-800 px-1 rounded">D</span>
                  Débito
                </span>
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-xs bg-green-100 text-green-800 px-1 rounded">C</span>
                  Crédito
                </span>
              </th>
              <th className="text-left px-4 py-3 font-medium w-36">Centro</th>
              <th className="text-right px-4 py-3 font-medium w-36">Valor</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum lançamento registrado.{" "}
                  <button className="underline text-primary" onClick={abrirNovo}>
                    Registrar o primeiro
                  </button>
                </td>
              </tr>
            )}
            {lancamentos.map((l) => (
              <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 text-sm tabular-nums">{fmtDate(l.data)}</td>
                <td className="px-4 py-2.5">
                  <span className="font-medium">{l.descricao}</span>
                  {l.documento && (
                    <Badge variant="outline" className="ml-2 text-xs">{l.documento}</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  <span className="font-mono">{l.debito.codigo}</span>
                  <span className="ml-1">{l.debito.nome}</span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  <span className="font-mono">{l.credito.codigo}</span>
                  <span className="ml-1">{l.credito.nome}</span>
                </td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">
                  {l.centroCusto?.nome ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-medium">
                  {fmt.format(l.valor)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => abrirEditar(l)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setExcluindo(l)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LancamentosForm
        open={open}
        onOpenChange={setOpen}
        lancamento={editando}
        contas={contas}
        centrosCusto={centrosCusto}
      />

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{excluindo?.descricao}&rdquo; — {excluindo ? fmt.format(excluindo.valor) : ""}
              <br />Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmarExclusao}
              disabled={pending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
