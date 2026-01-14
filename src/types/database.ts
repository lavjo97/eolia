// Types générés automatiquement par Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          motif: string | null
          notes: string | null
          patient_id: string | null
          reminder_sent: boolean | null
          start_time: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          motif?: string | null
          notes?: string | null
          patient_id?: string | null
          reminder_sent?: boolean | null
          start_time: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          motif?: string | null
          notes?: string | null
          patient_id?: string | null
          reminder_sent?: boolean | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      eolia_invoices: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          description: string | null
          id: string
          number: string
          paid_at: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string | null
          pdf_url: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          number: string
          paid_at?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          number?: string
          paid_at?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          gdpr_consent: boolean | null
          id: string
          last_name: string
          notes: string | null
          phone: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          gdpr_consent?: boolean | null
          id?: string
          last_name: string
          notes?: string | null
          phone: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          gdpr_consent?: boolean | null
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          department: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
          plan: string | null
          postal_code: string | null
          siret: string | null
          specialty: string | null
          stripe_customer_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          username: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          id: string
          name?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          siret?: string | null
          specialty?: string | null
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          siret?: string | null
          specialty?: string | null
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          username?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: { p_user_id: string }; Returns: string }
      generate_unique_username: { Args: { base_name: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Types d'état des rendez-vous
export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

// Types d'état des factures
export type InvoiceStatus = "unpaid" | "paid" | "cancelled";

// Structure des horaires de travail
export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // Format "HH:mm"
  end: string; // Format "HH:mm"
}

// Types utilitaires
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type Invoice = Database["public"]["Tables"]["eolia_invoices"]["Row"];

// Types avec relations
export interface AppointmentWithPatient extends Appointment {
  patient: Patient | null;
}

export interface PatientWithAppointments extends Patient {
  appointments: Appointment[];
}

// Spécialités disponibles
export const SPECIALTIES = [
  "Sophrologie",
  "Naturopathie",
  "Hypnothérapie",
  "Réflexologie",
  "Ostéopathie",
  "Kinésithérapie",
  "Psychologie",
  "Coaching",
  "Massage bien-être",
  "Autre",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];
