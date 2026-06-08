"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Props = {
  contas: { id: number; codigo: string; nome: string }[];
  contaId: number | null;
};

export function SeletorConta({ contas, contaId }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (e.target.value) next.set("conta", e.target.value);
    else next.delete("conta");
    next.set("aba", "razao");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <select
      value={contaId ?? ""}
      onChange={onChange}
      className="flex h-9 w-80 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="">Selecione uma conta...</option>
      {contas.map((c) => (
        <option key={c.id} value={c.id}>
          {c.codigo} — {c.nome}
        </option>
      ))}
    </select>
  );
}
