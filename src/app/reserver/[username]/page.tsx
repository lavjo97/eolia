import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking/booking-form";
import type { WorkingHours } from "@/types/database";

interface BookingPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, specialty, company_name")
    .eq("username", username)
    .single();
  
  if (!profile) {
    return {
      title: "Praticien non trouvé",
    };
  }
  
  return {
    title: `Réserver avec ${profile.name}`,
    description: `Prenez rendez-vous avec ${profile.name}, ${profile.specialty}${profile.company_name ? ` - ${profile.company_name}` : ""}`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { username } = await params;
  const supabase = await createClient();
  
  // Récupérer le profil du praticien
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, specialty, company_name, phone, working_hours")
    .eq("username", username)
    .single();
  
  if (!profile) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 40 40"
              className="h-8 w-8 text-primary"
              fill="none"
            >
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
              <path d="M20 22V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-bold">EOLIA</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Practitioner Info */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
              {profile.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">{profile.specialty}</p>
            {profile.company_name && (
              <p className="text-sm text-muted-foreground">{profile.company_name}</p>
            )}
            {profile.phone && (
              <p className="mt-2 text-sm text-muted-foreground">
                📞 {profile.phone}
              </p>
            )}
          </div>

          {/* Booking Form */}
          <BookingForm 
            practitionerId={profile.id}
            practitionerName={profile.name || ""}
            workingHours={(profile.working_hours as WorkingHours) || {}}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Propulsé par EOLIA - Assistant administratif pour praticiens</p>
        </div>
      </footer>
    </div>
  );
}
