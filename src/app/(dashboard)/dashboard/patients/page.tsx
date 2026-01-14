import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PatientsTable } from "@/components/patients/patients-table";
import { AddPatientButton } from "@/components/patients/add-patient-button";
import type { Patient } from "@/types/database";

export const metadata: Metadata = {
  title: "Patients",
  description: "Gérez vos patients",
};

interface PatientWithCount extends Patient {
  appointmentCount: number;
}

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Récupérer les patients
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Récupérer le nombre de RDV par patient
  const { data: appointments } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("user_id", user.id);

  // Compter les RDV par patient
  const countByPatient: Record<string, number> = {};
  appointments?.forEach(apt => {
    if (apt.patient_id) {
      countByPatient[apt.patient_id] = (countByPatient[apt.patient_id] || 0) + 1;
    }
  });

  const patientsWithCount: PatientWithCount[] = (patients || []).map((patient) => ({
    ...patient,
    appointmentCount: countByPatient[patient.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Gérez votre liste de patients
          </p>
        </div>
        <AddPatientButton userId={user.id} />
      </div>
      
      <PatientsTable patients={patientsWithCount} userId={user.id} />
    </div>
  );
}
