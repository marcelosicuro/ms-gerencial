import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Garante que o perfil existe no banco
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email!,
          nome: data.user.user_metadata?.full_name ?? null,
          avatar: data.user.user_metadata?.avatar_url ?? null,
        },
        create: {
          id: data.user.id,
          email: data.user.email!,
          nome: data.user.user_metadata?.full_name ?? null,
          avatar: data.user.user_metadata?.avatar_url ?? null,
        },
      });

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
