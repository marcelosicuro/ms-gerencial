"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { criarLancamento, editarLancamento } from "@/app/actions/lancamentos";
import type { LancamentoListItem, ContaOpcao, CentroCustoOpcao } from "./types";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Schema com tipos nativos do formulário (strings vindas dos inputs HTML)
const schema = z.object({
  data:          z.string().min(1, "Obrigatória"),
  descricao:     z.string().min(2, "Obrigatória").max(200),
  valor:         z.string().refine((v) => Number(v) > 0, "Deve ser maior que zero"),
  debitoId:      z.string().refine((v) => Number(v) > 0, "Obrigatória"),
  creditoId:     z.string().refine((v) => Number(v) > 0, "Obrigatória"),
  centroCustoId: z.number().nullable(),
  documento:     z.string().max(50).optional(),
}).refine((d) => d.debitoId !== d.creditoId, {
  message: "Não pode ser igual ao débito.",
  path: ["creditoId"],
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lancamento?: LancamentoListItem | null;
  contas: ContaOpcao[];
  centrosCusto: CentroCustoOpcao[];
};

function hoje() {
  return new Date().toISOString().split("T")[0];
}

export function LancamentosForm({ open, onOpenChange, lancamento, contas, centrosCusto }: Props) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, reset, control, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: hoje(),
      descricao: "",
      valor: "0",
      debitoId: "",
      creditoId: "",
      centroCustoId: null,
      documento: "",
    },
  });

  const debitoId = watch("debitoId");

  useEffect(() => {
    if (lancamento) {
      reset({
        data:          lancamento.data.toISOString().split("T")[0],
        descricao:     lancamento.descricao,
        valor:         String(lancamento.valor),
        debitoId:      String(lancamento.debito.id),
        creditoId:     String(lancamento.credito.id),
        centroCustoId: lancamento.centroCusto ? centrosCusto.find(c => c.nome === lancamento.centroCusto?.nome)?.id ?? null : null,
        documento:     lancamento.documento ?? "",
      });
    } else {
      reset({ data: hoje(), descricao: "", valor: "0", debitoId: "", creditoId: "", centroCustoId: null, documento: "" });
    }
  }, [lancamento, open, reset, centrosCusto]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const input = {
        ...values,
        valor:     Number(values.valor),
        debitoId:  Number(values.debitoId),
        creditoId: Number(values.creditoId),
      };
      const result = lancamento
        ? await editarLancamento(lancamento.id, input)
        : await criarLancamento(input);

      if (result.ok) {
        toast.success(lancamento ? "Lançamento atualizado." : "Lançamento registrado.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  // conta crédito não pode ter a mesma id que débito
  const contasCredito = contas.filter((c) => c.id !== Number(debitoId));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lancamento ? "Editar lançamento" : "Novo lançamento"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-6">
          {/* Data + Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register("data")} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                {...register("valor")}
              />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" placeholder="Ex: Pagamento de fornecedor" {...register("descricao")} />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
          </div>

          <Separator />

          {/* Partida dobrada */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Partida dobrada</p>

          <div className="space-y-1.5">
            <Label>
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">D</span>
                Conta débito
              </span>
            </Label>
            <Controller
              name="debitoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta de débito" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{c.codigo}</span>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.debitoId && <p className="text-xs text-destructive">{errors.debitoId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">C</span>
                Conta crédito
              </span>
            </Label>
            <Controller
              name="creditoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta de crédito" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {contasCredito.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{c.codigo}</span>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.creditoId && <p className="text-xs text-destructive">{errors.creditoId.message}</p>}
          </div>

          <Separator />

          {/* Opcionais */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opcionais</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Centro de custo</Label>
              <Controller
                name="centroCustoId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                    value={field.value != null ? String(field.value) : "none"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Nenhum</SelectItem>
                      {centrosCusto.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documento">Nº documento</Label>
              <Input id="documento" placeholder="NF-001, REC-42…" {...register("documento")} />
            </div>
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : lancamento ? "Salvar alterações" : "Registrar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
