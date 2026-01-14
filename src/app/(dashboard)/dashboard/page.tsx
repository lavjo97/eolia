import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, TrendingUp, Clock } from "lucide-react";
import { formatDate, formatTime, STATUS_LABELS } from "@/lib/utils";
import type { AppointmentStatus, Appointment, Patient } from "@/types/database";

interface AppointmentWithPatient extends Appointment {
  patient?: Pick<Patient, 'first_name' | 'last_name'> | null;
}

async function getStats(userId: string) {
  const supabase = await createClient();
  
  // Date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Comptage des patients
  const { count: patientCount } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  
  // RDV du mois
  const { data: monthAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", startOfMonth.toISOString())
    .lte("start_time", endOfMonth.toISOString());
  
  // RDV terminés ce mois (pour le CA)
  const completedAppointments = monthAppointments?.filter(
    (apt) => apt.status === "completed"
  ).length || 0;
  
  // CA estimé (60€ par séance en moyenne)
  const estimatedRevenue = completedAppointments * 60;
  
  // Prochains RDV
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(5);
  
  // Récupérer les patients pour ces RDV
  const patientIds = appointments?.map(a => a.patient_id).filter(Boolean) as string[];
  let patientsMap: Record<string, Pick<Patient, 'first_name' | 'last_name'>> = {};
  
  if (patientIds.length > 0) {
    const { data: patients } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .in("id", patientIds);
    
    if (patients) {
      patientsMap = patients.reduce((acc, p) => {
        acc[p.id] = { first_name: p.first_name, last_name: p.last_name };
        return acc;
      }, {} as Record<string, Pick<Patient, 'first_name' | 'last_name'>>);
    }
  }
  
  // Joindre les patients aux RDV
  const upcomingAppointments: AppointmentWithPatient[] = (appointments || []).map(apt => ({
    ...apt,
    patient: apt.patient_id ? patientsMap[apt.patient_id] || null : null
  }));
  
  return {
    patientCount: patientCount || 0,
    monthAppointmentsCount: monthAppointments?.length || 0,
    completedAppointments,
    estimatedRevenue,
    upcomingAppointments,
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

async function DashboardStats({ userId }: { userId: string }) {
  const stats = await getStats(userId);
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients"
          value={stats.patientCount}
          description="Total des patients"
          icon={Users}
        />
        <StatCard
          title="RDV ce mois"
          value={stats.monthAppointmentsCount}
          description={`${stats.completedAppointments} terminés`}
          icon={Calendar}
        />
        <StatCard
          title="CA estimé"
          value={`${stats.estimatedRevenue}€`}
          description="Ce mois-ci"
          icon={TrendingUp}
        />
        <StatCard
          title="Prochain RDV"
          value={
            stats.upcomingAppointments[0]
              ? formatTime(stats.upcomingAppointments[0].start_time)
              : "-"
          }
          description={
            stats.upcomingAppointments[0]
              ? formatDate(stats.upcomingAppointments[0].start_time, "EEEE d MMM")
              : "Aucun RDV prévu"
          }
          icon={Clock}
        />
      </div>

      {/* Upcoming Appointments */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Prochains rendez-vous</CardTitle>
          <CardDescription>
            Vos 5 prochains rendez-vous planifiés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.upcomingAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun rendez-vous à venir
            </p>
          ) : (
            <div className="space-y-4">
              {stats.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {appointment.patient
                          ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                          : "Patient anonyme"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.motif || "Consultation"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(appointment.start_time, "EEEE d MMMM")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {STATUS_LABELS[appointment.status as AppointmentStatus]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>
      
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 w-24 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <DashboardStats userId={user.id} />
      </Suspense>
    </div>
  );
}
