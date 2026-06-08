export type ContaOpcao = {
  id: number;
  codigo: string;
  nome: string;
};

export type CentroCustoOpcao = {
  id: number;
  nome: string;
};

export type LancamentoListItem = {
  id: number;
  data: Date;
  descricao: string;
  valor: number;
  documento: string | null;
  debito: ContaOpcao;
  credito: ContaOpcao;
  centroCusto: { nome: string } | null;
  lancadoPor: { nome: string | null; email: string };
};
