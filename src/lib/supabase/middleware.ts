import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Ne pas exécuter de code entre createServerClient et
  // supabase.auth.getUser(). Une simple erreur pourrait rendre très
  // difficile le débogage des problèmes de déconnexion aléatoire.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes publiques (pas besoin d'auth)
  const publicRoutes = ["/", "/login", "/register", "/auth/callback"];
  const isPublicRoute =
    publicRoutes.includes(request.nextUrl.pathname) ||
    request.nextUrl.pathname.startsWith("/reserver/");

  // Si pas d'utilisateur et route protégée, rediriger vers login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Si utilisateur connecté et sur une page d'auth, rediriger vers dashboard
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Il faut retourner l'objet supabaseResponse tel quel.
  // Si vous créez un nouvel objet response avec NextResponse.next(),
  // assurez-vous de :
  // 1. Passer la request dedans
  // 2. Copier les cookies
  return supabaseResponse;
}
