"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  data:          z.string().min(1, "Data obrigatória"),
  descricao:     z.string().min(2, "Descrição obrigatória").max(200),
  valor:         z.coerce.number().positive("Valor deve ser maior que zero"),
  debitoId:      z.coerce.number().int().positive("Conta débito obrigatória"),
  creditoId:     z.coerce.number().int().positive("Conta crédito obrigatória"),
  centroCustoId: z.coerce.number().int().positive().nullable().optional(),
  documento:     z.string().max(50).optional(),
}).refine((d) => d.debitoId !== d.creditoId, {
  message: "Conta débito e crédito não podem ser iguais.",
  path: ["creditoId"],
});

export type LancamentoInput = z.infer<typeof schema>;
export type ActionResult = { ok: true; id: number } | { ok: false; error: string };

function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Erro de validação";
}

const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

async function getOperadorId(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl) {
    // modo local sem autenticação — garante que o perfil dev existe
    await prisma.profile.upsert({
      where:  { id: DEV_USER_ID },
      update: {},
      create: { id: DEV_USER_ID, email: "dev@local", nome: "Dev Local" },
    });
    return DEV_USER_ID;
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function criarLancamento(data: LancamentoInput): Promise<ActionResult> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const operadorId = await getOperadorId();
  if (!operadorId) return { ok: false, error: "Usuário não autenticado." };

  // valida que ambas as contas são analíticas
  const [debito, credito] = await Promise.all([
    prisma.planoContas.findUnique({ where: { id: parsed.data.debitoId } }),
    prisma.planoContas.findUnique({ where: { id: parsed.data.creditoId } }),
  ]);

  if (!debito || debito.tipo !== "ANALITICA")
    return { ok: false, error: "Conta débito deve ser do tipo Analítica." };
  if (!credito || credito.tipo !== "ANALITICA")
    return { ok: false, error: "Conta crédito deve ser do tipo Analítica." };

  const lancamento = await prisma.lancamento.create({
    data: {
      data:          new Date(parsed.data.data),
      descricao:     parsed.data.descricao,
      valor:         parsed.data.valor,
      debitoId:      parsed.data.debitoId,
      creditoId:     parsed.data.creditoId,
      centroCustoId: parsed.data.centroCustoId ?? null,
      documento:     parsed.data.documento ?? null,
      lancadoPorId:  operadorId,
    },
  });

  revalidatePath("/contabilidade/lancamentos");
  return { ok: true, id: lancamento.id };
}

export async function editarLancamento(id: number, data: LancamentoInput): Promise<ActionResult> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const [debito, credito] = await Promise.all([
    prisma.planoContas.findUnique({ where: { id: parsed.data.debitoId } }),
    prisma.planoContas.findUnique({ where: { id: parsed.data.creditoId } }),
  ]);

  if (!debito || debito.tipo !== "ANALITICA")
    return { ok: false, error: "Conta débito deve ser do tipo Analítica." };
  if (!credito || credito.tipo !== "ANALITICA")
    return { ok: false, error: "Conta crédito deve ser do tipo Analítica." };

  await prisma.lancamento.update({
    where: { id },
    data: {
      data:          new Date(parsed.data.data),
      descricao:     parsed.data.descricao,
      valor:         parsed.data.valor,
      debitoId:      parsed.data.debitoId,
      creditoId:     parsed.data.creditoId,
      centroCustoId: parsed.data.centroCustoId ?? null,
      documento:     parsed.data.documento ?? null,
    },
  });

  revalidatePath("/contabilidade/lancamentos");
  return { ok: true, id };
}

export async function excluirLancamento(id: number): Promise<ActionResult> {
  await prisma.lancamento.delete({ where: { id } });
  revalidatePath("/contabilidade/lancamentos");
  return { ok: true, id };
}
