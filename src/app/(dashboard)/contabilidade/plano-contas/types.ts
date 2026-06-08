import type { TipoConta, NaturezaConta } from "@prisma/client";

export type Conta = {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  paiId: number | null;
  ativo: boolean;
};

export type ContaComNivel = Conta & { nivel: number };
