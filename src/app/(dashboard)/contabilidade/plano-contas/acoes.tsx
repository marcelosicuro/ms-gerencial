"use client";

import { useTransition } from "react";
import { alternarAtivo } from "@/app/actions/plano-contas";
import type { Conta } from "./types";
import { Button } from "@/components/ui/button";
import { Pencil, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";

export function AcoesConta({
  conta,
  onEditar,
}: {
  conta: Conta;
  onEditar: (c: Conta) => void;
}) {
  const [pending, startTransition] = useTransition();

  function toggleAtivo() {
    startTransition(async () => {
      const result = await alternarAtivo(conta.id, !conta.ativo);
      if (!result.ok) toast.error(result.error);
      else toast.success(conta.ativo ? "Conta desativada." : "Conta reativada.");
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditar(conta)} title="Editar">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon" variant="ghost"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={toggleAtivo} disabled={pending}
        title={conta.ativo ? "Desativar" : "Reativar"}
      >
        {conta.ativo ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
