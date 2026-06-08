"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  ListTree,
  FileText,
  Building2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",     href: "/dashboard",                          icon: LayoutDashboard },
  { label: "Plano de Contas", href: "/contabilidade/plano-contas",       icon: ListTree },
  { label: "Lançamentos",   href: "/contabilidade/lancamentos",          icon: FileText },
  { label: "Centros de Custo", href: "/contabilidade/centros-custo",     icon: Building2 },
  { label: "Relatórios",    href: "/contabilidade/relatorios",           icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r bg-background h-screen sticky top-0 flex flex-col">
      <div className="h-14 flex items-center px-6 border-b">
        <span className="font-semibold text-lg tracking-tight">MS Gerencial</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
