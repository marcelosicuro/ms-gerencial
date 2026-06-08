"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TipoConta, NaturezaConta } from "@prisma/client";
import { criarConta, editarConta } from "@/app/actions/plano-contas";
import type { Conta } from "./types";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  codigo:   z.string().min(1, "Obrigatório").max(20),
  nome:     z.string().min(2, "Mínimo 2 caracteres").max(100),
  tipo:     z.nativeEnum(TipoConta),
  natureza: z.nativeEnum(NaturezaConta),
  paiId:    z.number().nullable(),
});

type FormValues = z.infer<typeof schema>;

const tipoLabel: Record<TipoConta, string> = {
  SINTETICA: "Sintética (agrupa subcontas)",
  ANALITICA: "Analítica (recebe lançamentos)",
};

const naturezaLabel: Record<NaturezaConta, string> = {
  ATIVO:              "Ativo",
  PASSIVO:            "Passivo",
  PATRIMONIO_LIQUIDO: "Patrimônio Líquido",
  RECEITA:            "Receita",
  CUSTO:              "Custo",
  DESPESA:            "Despesa",
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conta?: Conta | null;
  paiInicial?: Conta | null;
  contasPai: { id: number; codigo: string; nome: string }[];
};

export function PlanoContasForm({ open, onOpenChange, conta, paiInicial, contasPai }: Props) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo:   "",
      nome:     "",
      tipo:     TipoConta.ANALITICA,
      natureza: NaturezaConta.ATIVO,
      paiId:    null,
    },
  });

  useEffect(() => {
    if (conta) {
      reset({
        codigo:   conta.codigo,
        nome:     conta.nome,
        tipo:     conta.tipo,
        natureza: conta.natureza,
        paiId:    conta.paiId,
      });
    } else if (paiInicial) {
      reset({
        codigo:   "",
        nome:     "",
        tipo:     TipoConta.ANALITICA,
        natureza: paiInicial.natureza,
        paiId:    paiInicial.id,
      });
    } else {
      reset({
        codigo:   "",
        nome:     "",
        tipo:     TipoConta.ANALITICA,
        natureza: NaturezaConta.ATIVO,
        paiId:    null,
      });
    }
  }, [conta, paiInicial, open, reset]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = conta
        ? await editarConta(conta.id, values)
        : await criarConta(values);

      if (result.ok) {
        toast.success(conta ? "Conta atualizada." : "Conta criada.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const titulo = conta
    ? "Editar conta"
    : paiInicial
    ? `Nova conta em ${paiInicial.codigo} — ${paiInicial.nome}`
    : "Nova conta raiz";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{titulo}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" placeholder="1.1.01" {...register("codigo")} />
              {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabel).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" placeholder="Ex: Caixa e Equivalentes" {...register("nome")} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Natureza</Label>
            <Controller
              name="natureza"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(naturezaLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Conta pai: bloqueada quando criando filha, editável nos demais casos */}
          <div className="space-y-1.5">
            <Label>Conta pai <span className="text-muted-foreground text-xs">(opcional)</span></Label>

            {paiInicial && !conta ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/50 text-sm text-muted-foreground">
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span>{paiInicial.codigo} — {paiInicial.nome}</span>
              </div>
            ) : (
              <Controller
                name="paiId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                    value={field.value != null ? String(field.value) : "none"}
                  >
                    <SelectTrigger><SelectValue placeholder="Nenhuma (conta raiz)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Nenhuma (conta raiz)</SelectItem>
                      {contasPai.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.codigo} — {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : conta ? "Salvar alterações" : "Criar conta"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
