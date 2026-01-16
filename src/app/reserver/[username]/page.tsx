import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking/booking-form";
import { PWAInstaller } from "@/components/pwa/pwa-installer";
import type { WorkingHours } from "@/types/database";
import { MapPin, Phone, Clock } from "lucide-react";

interface BookingPageProps {
  params: Promise<{ username: string }>;
}

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: `RDV ${profile.name}`,
    },
    openGraph: {
      title: `Prendre rendez-vous avec ${profile.name}`,
      description: `Réservez votre consultation en ligne avec ${profile.name}, ${profile.specialty}`,
      type: "website",
    },
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { username } = await params;
  const supabase = await createClient();
  
  // Récupérer le profil du praticien
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, specialty, company_name, phone, address, working_hours")
    .eq("username", username)
    .single();
  
  if (!profile) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header fixe style Doctolib */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600">
              <svg viewBox="0 0 40 40" className="h-5 w-5 text-white" fill="none">
                <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <circle cx="20" cy="20" r="2" fill="currentColor" />
                <path d="M20 22V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">EOLIA</span>
          </div>
          
          {/* Indicateur de sécurité */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Connexion sécurisée
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mx-auto max-w-lg">
          
          {/* Card Praticien style Doctolib */}
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              {/* Avatar avec initiales */}
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-2xl font-bold text-white shadow-lg shadow-teal-500/20">
                  {profile.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white ring-2 ring-white">
                  <Clock className="h-3 w-3" />
                </div>
              </div>
              
              {/* Infos praticien */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{profile.name}</h1>
                <p className="text-sm font-medium text-teal-600">{profile.specialty}</p>
                
                <div className="mt-2 space-y-1">
                  {profile.company_name && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{profile.company_name}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <a 
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-teal-600 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Badge disponibilité */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-sm font-medium text-teal-700">Prochaines disponibilités cette semaine</span>
            </div>
          </div>

          {/* Formulaire de réservation */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <BookingForm 
              practitionerId={profile.id}
              practitionerName={profile.name || ""}
              practitionerSpecialty={profile.specialty || ""}
              practitionerAddress={profile.company_name || ""}
              practitionerPhone={profile.phone || ""}
              workingHours={(profile.working_hours as WorkingHours) || {}}
            />
          </div>
          
          {/* Badges de confiance */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Données sécurisées
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Confirmation instantanée
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              Rappel SMS gratuit
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimaliste */}
      <footer className="mt-auto border-t bg-white/50 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            Propulsé par <span className="font-semibold text-gray-500">EOLIA</span>
          </p>
        </div>
      </footer>
      
      {/* Install PWA Banner - affiché uniquement sur mobile */}
      <PWAInstaller />
    </div>
  );
}
