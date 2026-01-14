import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";
import type { WorkingHours } from "@/types/database";

export const metadata: Metadata = {
  title: "Configuration de votre cabinet",
  description: "Configurez votre compte EOLIA en quelques minutes",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Récupérer le profil existant
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  // Si l'onboarding est déjà complété, rediriger vers le dashboard
  if (profile?.username && profile?.name && profile?.specialty) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Configurez votre cabinet
        </h1>
        <p className="text-sm text-muted-foreground">
          3 étapes rapides pour commencer à recevoir des réservations
        </p>
      </div>
      
      <OnboardingWizard 
        userId={user.id}
        initialData={{
          name: profile?.name || "",
          businessName: profile?.company_name || "",
          specialty: profile?.specialty || "",
          phone: profile?.phone || "",
          workingHours: (profile?.working_hours as WorkingHours) || {},
          username: profile?.username || "",
        }}
      />
    </div>
  );
}
