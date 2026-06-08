"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Printer } from "lucide-react";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const anoAtual = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => anoAtual - i);

export function FiltrosPeriodo() {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();

  const ano: string = params?.get("ano") ?? String(anoAtual);
  const mes: string = params?.get("mes") ?? "todos";

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params?.toString() ?? "");
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, params]
  );

  return (
    <div className="flex items-center gap-3 flex-wrap print:hidden">
      <Select value={ano} onValueChange={(v) => update("ano", v)}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANOS.map((a) => (
            <SelectItem key={a} value={String(a)}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={mes} onValueChange={(v) => update("mes", v === "todos" ? "" : v)} defaultValue="todos">
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Ano completo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Ano completo</SelectItem>
          {MESES.map((m, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={() => window.print()}
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        Imprimir
      </Button>
    </div>
  );
}
