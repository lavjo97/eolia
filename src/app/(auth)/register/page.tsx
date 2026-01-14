import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte EOLIA et commencez à gérer votre cabinet",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Créer votre compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Commencez à gérer votre cabinet en quelques minutes
        </p>
      </div>
      
      <RegisterForm />
      
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Déjà un compte ? </span>
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
