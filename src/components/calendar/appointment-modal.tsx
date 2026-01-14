"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABELS } from "@/lib/utils";
import type { AppointmentStatus } from "@/types/database";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface AppointmentEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    status: AppointmentStatus;
    patientId: string | null;
    patientName: string;
    motif: string | null;
  };
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  patients: Patient[];
  selectedEvent: AppointmentEvent | null;
  selectedDateRange: { start: Date; end: Date } | null;
}

const appointmentSchema = z.object({
  patientId: z.string().optional(),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  motif: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export function AppointmentModal({
  isOpen,
  onClose,
  userId,
  patients,
  selectedEvent,
  selectedDateRange,
}: AppointmentModalProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = !!selectedEvent;

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      date: "",
      startTime: "",
      endTime: "",
      motif: "",
      status: "scheduled",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedEvent) {
        // Editing existing appointment
        const startDate = new Date(selectedEvent.start);
        const endDate = new Date(selectedEvent.end);
        
        form.reset({
          patientId: selectedEvent.extendedProps.patientId || "",
          date: format(startDate, "yyyy-MM-dd"),
          startTime: format(startDate, "HH:mm"),
          endTime: format(endDate, "HH:mm"),
          motif: selectedEvent.extendedProps.motif || "",
          status: selectedEvent.extendedProps.status,
        });
      } else if (selectedDateRange) {
        // Creating new appointment from date selection
        form.reset({
          patientId: "",
          date: format(selectedDateRange.start, "yyyy-MM-dd"),
          startTime: format(selectedDateRange.start, "HH:mm"),
          endTime: format(selectedDateRange.end, "HH:mm"),
          motif: "",
          status: "scheduled",
        });
      }
    }
  }, [isOpen, selectedEvent, selectedDateRange, form]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      const supabase = createClient();
      
      const startTime = new Date(`${data.date}T${data.startTime}`);
      const endTime = new Date(`${data.date}T${data.endTime}`);
      
      const appointmentData = {
        user_id: userId,
        patient_id: data.patientId || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        motif: data.motif || null,
        status: data.status,
      };

      if (isEditing && selectedEvent) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", selectedEvent.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("appointments")
          .insert(appointmentData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(isEditing ? "Rendez-vous modifié" : "Rendez-vous créé");
      onClose();
    },
    onError: () => {
      toast.error("Une erreur est survenue");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) return;
      
      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", selectedEvent.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Rendez-vous supprimé");
      onClose();
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const onSubmit = (data: AppointmentFormValues) => {
    saveMutation.mutate(data);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les détails du rendez-vous"
              : "Créez un nouveau rendez-vous"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sans patient</SelectItem>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Début</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Première consultation"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map(
                          (status) => (
                            <SelectItem key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saveMutation.isPending || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saveMutation.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
