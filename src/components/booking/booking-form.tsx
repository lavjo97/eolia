"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Phone,
  Calendar,
  Clock,
  User,
  Mail,
  Smartphone,
  Shield,
  ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { generateTimeSlots, formatTime } from "@/lib/utils";
import type { WorkingHours } from "@/types/database";

interface BookingFormProps {
  practitionerId: string;
  practitionerName: string;
  practitionerSpecialty?: string;
  practitionerAddress?: string;
  practitionerPhone?: string;
  workingHours: WorkingHours;
  motifs?: { label: string; duration: number }[];
}

const bookingSchema = z.object({
  firstName: z.string().min(2, "Prénom requis (min. 2 caractères)"),
  lastName: z.string().min(2, "Nom requis (min. 2 caractères)"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter pour continuer",
  }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// Motifs par défaut sans durée visible
const DEFAULT_MOTIFS = [
  { label: "Première consultation", duration: 60 },
  { label: "Consultation de suivi", duration: 45 },
  { label: "Bilan", duration: 30 },
];

export function BookingForm({ 
  practitionerId, 
  practitionerName, 
  practitionerSpecialty,
  practitionerAddress,
  practitionerPhone,
  workingHours,
  motifs = DEFAULT_MOTIFS
}: BookingFormProps) {
  // États
  const [step, setStep] = useState<"motif" | "date" | "time" | "info" | "confirm">("motif");
  const [selectedMotif, setSelectedMotif] = useState<{ label: string; duration: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [visibleDays, setVisibleDays] = useState<Date[]>([]);
  const [startDayIndex, setStartDayIndex] = useState(0);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gdprConsent: false,
    },
  });

  // Générer les jours visibles (7 jours à la fois)
  useEffect(() => {
    const days: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 14; i++) {
      const day = addDays(today, i);
      const dayName = format(day, "EEEE").toLowerCase() as keyof WorkingHours;
      if (workingHours[dayName]?.enabled) {
        days.push(day);
      }
    }
    setVisibleDays(days);
  }, [workingHours]);

  // Charger les créneaux quand la date change
  useEffect(() => {
    if (!selectedDate || !selectedMotif) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedTime(null);
      
      try {
        const supabase = createClient();
        const startOfSelectedDay = startOfDay(selectedDate);
        const endOfSelectedDay = addDays(startOfSelectedDay, 1);
        
        const { data: appointments } = await supabase
          .from("appointments")
          .select("start_time, end_time")
          .eq("user_id", practitionerId)
          .gte("start_time", startOfSelectedDay.toISOString())
          .lt("start_time", endOfSelectedDay.toISOString())
          .neq("status", "cancelled");
        
        const slots = generateTimeSlots(
          selectedDate,
          workingHours,
          appointments || [],
          selectedMotif.duration
        );
        
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("Erreur lors du chargement des créneaux");
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, practitionerId, workingHours, selectedMotif]);

  // Sélectionner un motif
  const handleMotifSelect = (motif: { label: string; duration: number }) => {
    setSelectedMotif(motif);
    setStep("date");
  };

  // Sélectionner une date
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep("time");
  };

  // Sélectionner un créneau
  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setStep("info");
  };

  // Retour en arrière
  const handleBack = () => {
    if (step === "date") {
      setStep("motif");
      setSelectedMotif(null);
    } else if (step === "time") {
      setStep("date");
      setSelectedDate(undefined);
    } else if (step === "info") {
      setStep("time");
      setSelectedTime(null);
    }
  };

  // Soumettre le formulaire
  const onSubmit = async (data: BookingFormValues) => {
    if (!selectedDate || !selectedTime || !selectedMotif) {
      toast.error("Veuillez compléter toutes les étapes");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Vérifier si le patient existe déjà
      let patientId: string;
      
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", practitionerId)
        .eq("email", data.email)
        .single();
      
      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert({
            user_id: practitionerId,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone.replace(/\s/g, ""),
            gdpr_consent: data.gdprConsent,
          })
          .select("id")
          .single();
        
        if (patientError) throw patientError;
        patientId = newPatient.id;
      }
      
      // Calculer l'heure de fin
      const endTime = new Date(selectedTime);
      endTime.setMinutes(endTime.getMinutes() + selectedMotif.duration);
      
      // Créer le rendez-vous
      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          user_id: practitionerId,
          patient_id: patientId,
          start_time: selectedTime.toISOString(),
          end_time: endTime.toISOString(),
          motif: selectedMotif.label,
          status: "scheduled",
        });
      
      if (appointmentError) throw appointmentError;
      
      setIsComplete(true);
      setStep("confirm");
      toast.success("Rendez-vous confirmé !");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Une erreur est survenue lors de la réservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation des jours
  const showPreviousDays = () => {
    setStartDayIndex(Math.max(0, startDayIndex - 5));
  };

  const showNextDays = () => {
    setStartDayIndex(Math.min(visibleDays.length - 5, startDayIndex + 5));
  };

  // Page de confirmation
  if (isComplete) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Rendez-vous confirmé</h2>
            <p className="mb-6 text-gray-600">
              Votre rendez-vous a bien été enregistré
            </p>
            
            <div className="mb-6 rounded-xl bg-gray-50 p-4 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Praticien</p>
                  <p className="font-semibold text-gray-900">{practitionerName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {format(selectedDate!, "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Heure</p>
                  <p className="font-semibold text-gray-900">{formatTime(selectedTime!)}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">📧 Confirmation envoyée</p>
              <p>Un email de confirmation vous a été envoyé avec tous les détails.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {step !== "motif" && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {["motif", "date", "time", "info"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                ["motif", "date", "time", "info"].indexOf(step) >= i
                  ? "bg-teal-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Étape 1: Motif */}
      {step === "motif" && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quel est le motif de votre visite ?</h2>
            <p className="text-gray-500 mt-1">Sélectionnez le type de consultation</p>
          </div>
          
          <div className="space-y-3">
            {motifs.map((motif) => (
              <button
                key={motif.label}
                onClick={() => handleMotifSelect(motif)}
                className="w-full p-4 text-left rounded-xl border-2 border-gray-100 hover:border-teal-500 hover:bg-teal-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 group-hover:text-teal-700">
                    {motif.label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-teal-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 2: Date */}
      {step === "date" && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Choisissez une date</h2>
            <p className="text-gray-500 mt-1">{selectedMotif?.label}</p>
          </div>

          {/* Sélecteur de jours horizontal style Doctolib */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={showPreviousDays}
                disabled={startDayIndex === 0}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-600">
                {format(visibleDays[startDayIndex] || new Date(), "MMMM yyyy", { locale: fr })}
              </span>
              <button
                onClick={showNextDays}
                disabled={startDayIndex >= visibleDays.length - 5}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {visibleDays.slice(startDayIndex, startDayIndex + 5).map((day) => {
                const isSelected = selectedDate?.getTime() === day.getTime();
                const isToday = day.getTime() === startOfDay(new Date()).getTime();
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateSelect(day)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      isSelected
                        ? "bg-teal-500 text-white shadow-lg scale-105"
                        : "bg-gray-50 hover:bg-teal-50 text-gray-900"
                    }`}
                  >
                    <span className={`text-xs uppercase ${isSelected ? "text-teal-100" : "text-gray-500"}`}>
                      {format(day, "EEE", { locale: fr })}
                    </span>
                    <span className="text-xl font-bold mt-1">
                      {format(day, "d")}
                    </span>
                    {isToday && (
                      <span className={`text-[10px] mt-0.5 ${isSelected ? "text-teal-100" : "text-teal-600"}`}>
                        Aujourd'hui
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendrier complet en option */}
          <details className="mt-4">
            <summary className="text-sm text-teal-600 cursor-pointer hover:text-teal-700 text-center">
              Voir plus de dates
            </summary>
            <div className="mt-4 flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && handleDateSelect(date)}
                disabled={(date) => {
                  if (date < startOfDay(new Date())) return true;
                  const dayName = format(date, "EEEE").toLowerCase() as keyof WorkingHours;
                  return !workingHours[dayName]?.enabled;
                }}
                locale={fr}
                className="rounded-xl border shadow-sm"
              />
            </div>
          </details>
        </div>
      )}

      {/* Étape 3: Heure */}
      {step === "time" && selectedDate && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Choisissez un horaire</h2>
            <p className="text-gray-500 mt-1 capitalize">
              {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </p>
          </div>

          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Aucun créneau disponible</p>
              <p className="text-gray-500 text-sm mt-1">Essayez une autre date</p>
              <Button
                variant="outline"
                onClick={handleBack}
                className="mt-4"
              >
                Choisir une autre date
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grouper par matin/après-midi */}
              {["Matin", "Après-midi"].map((period) => {
                const periodSlots = availableSlots.filter((slot) => {
                  const hour = slot.getHours();
                  return period === "Matin" ? hour < 12 : hour >= 12;
                });

                if (periodSlots.length === 0) return null;

                return (
                  <div key={period}>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{period}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {periodSlots.map((slot) => (
                        <button
                          key={slot.toISOString()}
                          onClick={() => handleTimeSelect(slot)}
                          className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                            selectedTime?.getTime() === slot.getTime()
                              ? "bg-teal-500 text-white shadow-md"
                              : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                          }`}
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Étape 4: Informations */}
      {step === "info" && selectedTime && (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Vos coordonnées</h2>
            <p className="text-gray-500 mt-1">Pour confirmer votre rendez-vous</p>
          </div>

          {/* Récapitulatif */}
          <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4 border border-teal-100">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Calendar className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 capitalize">
                  {format(selectedDate!, "EEEE d MMMM", { locale: fr })} à {formatTime(selectedTime)}
                </p>
                <p className="text-sm text-gray-600">{selectedMotif?.label}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Prénom</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Marie" 
                            className="pl-10 h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nom</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Dupont" 
                            className="pl-10 h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="marie.dupont@email.com"
                          className="pl-10 h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Téléphone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="tel"
                          placeholder="06 12 34 56 78"
                          className="pl-10 h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gdprConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm text-gray-700 font-normal">
                        J'accepte que mes données soient traitées pour la gestion de mon rendez-vous
                      </FormLabel>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Shield className="h-3 w-3" />
                        Données sécurisées et confidentielles
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-base shadow-lg shadow-teal-500/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Confirmation en cours...
                  </>
                ) : (
                  "Confirmer le rendez-vous"
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
