import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, addMinutes, isBefore, isAfter, setHours, setMinutes, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { WorkingHours, TimeSlot } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatage des dates en français
export function formatDate(date: string | Date, formatStr: string = "d MMMM yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr, { locale: fr });
}

export function formatTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: fr });
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE d MMMM yyyy à HH:mm", { locale: fr });
}

// Formatage du numéro de téléphone français
export function formatPhoneNumber(phone: string): string {
  // Nettoyer le numéro
  const cleaned = phone.replace(/\D/g, "");
  
  // Format français : 06 12 34 56 78
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  }
  
  // Format international français : +33 6 12 34 56 78
  if (cleaned.length === 11 && cleaned.startsWith("33")) {
    const national = "0" + cleaned.slice(2);
    return formatPhoneNumber(national);
  }
  
  return phone;
}

// Convertir en format E.164 pour Twilio
export function toE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+33" + cleaned.slice(1);
  }
  
  if (cleaned.startsWith("33") && cleaned.length === 11) {
    return "+" + cleaned;
  }
  
  return phone;
}

// Génération des créneaux disponibles
export function generateTimeSlots(
  date: Date,
  workingHours: WorkingHours,
  existingAppointments: { start_time: string; end_time: string }[],
  slotDuration: number = 60 // minutes
): Date[] {
  const dayName = format(date, "EEEE").toLowerCase() as keyof WorkingHours;
  const daySchedule = workingHours[dayName];
  
  if (!daySchedule?.enabled || !daySchedule.slots.length) {
    return [];
  }
  
  const slots: Date[] = [];
  const dayStart = startOfDay(date);
  
  for (const slot of daySchedule.slots) {
    const [startHour, startMin] = slot.start.split(":").map(Number);
    const [endHour, endMin] = slot.end.split(":").map(Number);
    
    let current = setMinutes(setHours(dayStart, startHour), startMin);
    const slotEnd = setMinutes(setHours(dayStart, endHour), endMin);
    
    while (isBefore(addMinutes(current, slotDuration), slotEnd) || 
           current.getTime() + slotDuration * 60000 === slotEnd.getTime()) {
      const slotEndTime = addMinutes(current, slotDuration);
      
      // Vérifier si le créneau est disponible
      const isAvailable = !existingAppointments.some((apt) => {
        const aptStart = parseISO(apt.start_time);
        const aptEnd = parseISO(apt.end_time);
        // Chevauchement si : début avant fin ET fin après début
        return isBefore(current, aptEnd) && isAfter(slotEndTime, aptStart);
      });
      
      if (isAvailable && isAfter(current, new Date())) {
        slots.push(current);
      }
      
      current = addMinutes(current, slotDuration);
    }
  }
  
  return slots;
}

// Génération du numéro de facture
export function generateInvoiceNumber(existingCount: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const number = String(existingCount + 1).padStart(3, "0");
  return `FAC-${year}-${month}-${number}`;
}

// Validation email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation téléphone français
export function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return (
    (cleaned.length === 10 && cleaned.startsWith("0")) ||
    (cleaned.length === 11 && cleaned.startsWith("33"))
  );
}

// Horaires de travail par défaut
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: {
    enabled: true,
    slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
  },
  tuesday: {
    enabled: true,
    slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
  },
  wednesday: {
    enabled: true,
    slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
  },
  thursday: {
    enabled: true,
    slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
  },
  friday: {
    enabled: true,
    slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
  },
  saturday: {
    enabled: false,
    slots: [],
  },
  sunday: {
    enabled: false,
    slots: [],
  },
};

// Couleurs par statut de rendez-vous
export const STATUS_COLORS = {
  scheduled: "bg-primary text-primary-foreground",
  completed: "bg-green-500 text-white",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive text-destructive-foreground",
} as const;

export const STATUS_LABELS = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
} as const;

// Motifs de consultation par défaut
export const DEFAULT_MOTIFS = [
  { label: "Première consultation", duration: 60 },
  { label: "Suivi", duration: 45 },
  { label: "Consultation courte", duration: 30 },
] as const;
