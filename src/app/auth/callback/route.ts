import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Vérifier si l'utilisateur a complété l'onboarding
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, name, specialty")
          .eq("id", user.id)
          .single();
        
        // Si le profil n'est pas complet, rediriger vers l'onboarding
        if (!profile?.username || !profile?.name || !profile?.specialty) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // En cas d'erreur, rediriger vers la page de login avec un message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
