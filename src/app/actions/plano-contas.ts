"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TipoConta, NaturezaConta } from "@prisma/client";

const schema = z.object({
  codigo:   z.string().min(1, "Código obrigatório").max(20),
  nome:     z.string().min(2, "Nome obrigatório").max(100),
  tipo:     z.nativeEnum(TipoConta),
  natureza: z.nativeEnum(NaturezaConta),
  paiId:    z.number().nullable().optional(),
});

export type PlanoContasInput = z.infer<typeof schema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Erro de validação";
}

export async function criarConta(data: PlanoContasInput): Promise<ActionResult> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const existe = await prisma.planoContas.findUnique({ where: { codigo: parsed.data.codigo } });
  if (existe) return { ok: false, error: `Código ${parsed.data.codigo} já está em uso.` };

  await prisma.planoContas.create({
    data: {
      codigo:   parsed.data.codigo,
      nome:     parsed.data.nome,
      tipo:     parsed.data.tipo,
      natureza: parsed.data.natureza,
      paiId:    parsed.data.paiId ?? null,
    },
  });

  revalidatePath("/contabilidade/plano-contas");
  return { ok: true };
}

export async function editarConta(id: number, data: PlanoContasInput): Promise<ActionResult> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const codigoEmUso = await prisma.planoContas.findFirst({
    where: { codigo: parsed.data.codigo, NOT: { id } },
  });
  if (codigoEmUso) return { ok: false, error: `Código ${parsed.data.codigo} já está em uso.` };

  await prisma.planoContas.update({
    where: { id },
    data: {
      codigo:   parsed.data.codigo,
      nome:     parsed.data.nome,
      tipo:     parsed.data.tipo,
      natureza: parsed.data.natureza,
      paiId:    parsed.data.paiId ?? null,
    },
  });

  revalidatePath("/contabilidade/plano-contas");
  return { ok: true };
}

export async function alternarAtivo(id: number, ativo: boolean): Promise<ActionResult> {
  if (!ativo) {
    const filhosAtivos = await prisma.planoContas.count({ where: { paiId: id, ativo: true } });
    if (filhosAtivos > 0)
      return { ok: false, error: "Desative as subcontas antes de desativar esta conta." };
  }

  await prisma.planoContas.update({ where: { id }, data: { ativo } });
  revalidatePath("/contabilidade/plano-contas");
  return { ok: true };
}
