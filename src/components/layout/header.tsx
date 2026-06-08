import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export async function Header() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const configured = supabaseUrl && !supabaseUrl.includes("[project-ref]");

  let nome = "Usuário";
  let avatar: string | undefined;

  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    nome = user?.user_metadata?.full_name ?? user?.email ?? "Usuário";
    avatar = user?.user_metadata?.avatar_url;
  }
  const iniciais = nome.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  async function signOut() {
    "use server";
    const sb = await createClient();
    await sb.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="h-14 border-b flex items-center justify-end gap-2 px-6 bg-background">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar} alt={nome} />
            <AvatarFallback>{iniciais}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">{nome}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <form action={signOut} className="w-full">
              <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
