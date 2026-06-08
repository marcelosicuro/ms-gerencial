import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parsePeriodo } from "@/lib/contabilidade";
import { FiltrosPeriodo } from "./filtros";
import { DRE } from "./dre";
import { Balanco } from "./balanco";
import { Razao } from "./razao";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function Loading() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default async function RelatoriosPage({ searchParams }: Props) {
  const sp      = await searchParams;
  const { inicio, fim, ano, mes } = parsePeriodo(sp);
  const aba     = (sp.aba as string) ?? "dre";
  const contaId = sp.conta ? Number(sp.conta) : null;

  const MESES = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];
  const labelPeriodo = mes
    ? `${MESES[mes - 1]} / ${ano}`
    : `Ano ${ano}`;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm">{labelPeriodo}</p>
        </div>
        <Suspense>
          <FiltrosPeriodo />
        </Suspense>
      </div>

      {/* Abas */}
      <Tabs defaultValue={aba}>
        <TabsList className="print:hidden">
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="balanco">Balanço Patrimonial</TabsTrigger>
          <TabsTrigger value="razao">Razão por Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="dre" className="mt-6">
          <Suspense fallback={<Loading />}>
            <DRE inicio={inicio} fim={fim} />
          </Suspense>
        </TabsContent>

        <TabsContent value="balanco" className="mt-6">
          <Suspense fallback={<Loading />}>
            <Balanco inicio={inicio} fim={fim} />
          </Suspense>
        </TabsContent>

        <TabsContent value="razao" className="mt-6">
          <Suspense fallback={<Loading />}>
            <Razao inicio={inicio} fim={fim} contaId={contaId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
