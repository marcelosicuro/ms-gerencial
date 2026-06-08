import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { TrendingUp, TrendingDown, BookOpen, Users } from "lucide-react";

export default async function DashboardPage() {
  let totalLancamentos = 0, totalContas = 0, totalCentros = 0;
  try {
    [totalLancamentos, totalContas, totalCentros] = await Promise.all([
      prisma.lancamento.count(),
      prisma.planoContas.count({ where: { ativo: true } }),
      prisma.centroCusto.count({ where: { ativo: true } }),
    ]);
  } catch { /* DB não configurado */ }

  const stats = [
    { title: "Lançamentos",      value: totalLancamentos, icon: BookOpen,     desc: "total registrados" },
    { title: "Contas Ativas",    value: totalContas,      icon: TrendingUp,   desc: "no plano de contas" },
    { title: "Centros de Custo", value: totalCentros,     icon: TrendingDown, desc: "ativos" },
    { title: "Usuários",         value: "-",              icon: Users,        desc: "em breve" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da contabilidade gerencial</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, desc }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
