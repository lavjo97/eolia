import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Récupérer le profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  // Si l'onboarding n'est pas complété, rediriger
  if (!profile?.username || !profile?.name || !profile?.specialty) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <DashboardSidebar profile={profile} />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardHeader profile={profile} />
        
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
