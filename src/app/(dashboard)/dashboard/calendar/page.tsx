import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = {
  title: "Calendrier",
  description: "Gérez vos rendez-vous",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Récupérer les patients pour le formulaire de création de RDV
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .order("last_name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
        <p className="text-muted-foreground">
          Visualisez et gérez tous vos rendez-vous
        </p>
      </div>
      
      <CalendarView userId={user.id} patients={patients || []} />
    </div>
  );
}
