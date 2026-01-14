"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, CalendarDays, Clock, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { generateTimeSlots, formatTime, isValidFrenchPhone, DEFAULT_MOTIFS } from "@/lib/utils";
import type { WorkingHours } from "@/types/database";

interface BookingFormProps {
  practitionerId: string;
  practitionerName: string;
  workingHours: WorkingHours;
}

const bookingSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Téléphone requis").refine(
    (val) => isValidFrenchPhone(val),
    "Format de téléphone invalide (ex: 06 12 34 56 78)"
  ),
  motif: z.string().min(1, "Veuillez sélectionner un motif"),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter le traitement de vos données",
  }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingForm({ practitionerId, practitionerName, workingHours }: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedMotif, setSelectedMotif] = useState<{ label: string; duration: number }>(DEFAULT_MOTIFS[0]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      motif: DEFAULT_MOTIFS[0].label,
      gdprConsent: false,
    },
  });

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedTime(null);
      
      try {
        const supabase = createClient();
        
        // Get existing appointments for this date
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
  }, [selectedDate, practitionerId, workingHours, selectedMotif.duration]);

  const handleMotifChange = (value: string) => {
    const motif = DEFAULT_MOTIFS.find((m) => m.label === value);
    if (motif) {
      setSelectedMotif(motif);
      form.setValue("motif", value);
      setSelectedTime(null);
    }
  };

  const onSubmit = async (data: BookingFormValues) => {
    if (!selectedDate || !selectedTime) {
      toast.error("Veuillez sélectionner une date et un créneau");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Check if patient already exists
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
        // Create new patient
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
      
      // Calculate end time
      const endTime = new Date(selectedTime);
      endTime.setMinutes(endTime.getMinutes() + selectedMotif.duration);
      
      // Create appointment
      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          user_id: practitionerId,
          patient_id: patientId,
          start_time: selectedTime.toISOString(),
          end_time: endTime.toISOString(),
          motif: data.motif,
          status: "scheduled",
        });
      
      if (appointmentError) throw appointmentError;
      
      setIsComplete(true);
      toast.success("Rendez-vous confirmé !");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Une erreur est survenue lors de la réservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disable past dates and days without working hours
  const isDateDisabled = (date: Date) => {
    if (date < startOfDay(new Date())) return true;
    
    const dayName = format(date, "EEEE").toLowerCase() as keyof WorkingHours;
    const daySchedule = workingHours[dayName];
    
    return !daySchedule?.enabled;
  };

  if (isComplete) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Rendez-vous confirmé !</h2>
          <p className="mb-6 text-muted-foreground">
            Votre rendez-vous avec {practitionerName} a été réservé pour le{" "}
            <strong>{format(selectedDate!, "EEEE d MMMM yyyy", { locale: fr })}</strong> à{" "}
            <strong>{formatTime(selectedTime!)}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Un email de confirmation vous a été envoyé.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Date and Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            1. Choisissez une date et un créneau
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Motif Selection */}
          <div className="space-y-2">
            <Label>Type de consultation</Label>
            <Select
              value={selectedMotif.label}
              onValueChange={handleMotifChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_MOTIFS.map((motif) => (
                  <SelectItem key={motif.label} value={motif.label}>
                    {motif.label} ({motif.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar */}
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              locale={fr}
              className="rounded-md border"
            />

            {/* Time Slots */}
            <div className="flex-1 w-full">
              {selectedDate ? (
                <>
                  <p className="mb-3 text-sm font-medium">
                    Créneaux disponibles le{" "}
                    {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                  </p>
                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      Aucun créneau disponible ce jour-là
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.toISOString()}
                          variant={selectedTime?.getTime() === slot.getTime() ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(slot)}
                          className="text-sm"
                        >
                          {formatTime(slot)}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Sélectionnez une date pour voir les créneaux disponibles
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Contact Information */}
      {selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              2. Vos informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Marie" {...field} />
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
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="marie.dupont@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Pour recevoir la confirmation de votre rendez-vous
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="06 12 34 56 78"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Pour recevoir un rappel SMS avant votre rendez-vous
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gdprConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          J&apos;accepte le traitement de mes données personnelles
                        </FormLabel>
                        <FormDescription>
                          Vos données sont utilisées uniquement pour la gestion de vos
                          rendez-vous et ne seront jamais partagées avec des tiers.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Summary */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 font-medium">Récapitulatif</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Date :</span>{" "}
                      {format(selectedDate!, "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Heure :</span>{" "}
                      {formatTime(selectedTime)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Motif :</span>{" "}
                      {selectedMotif.label} ({selectedMotif.duration} min)
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmer le rendez-vous
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
