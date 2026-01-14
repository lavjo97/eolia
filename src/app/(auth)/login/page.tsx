import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte EOLIA",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bon retour parmi nous
        </h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre tableau de bord
        </p>
      </div>
      
      <LoginForm />
      
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Pas encore de compte ? </span>
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
