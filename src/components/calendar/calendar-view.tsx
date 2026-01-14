"use client";

import { useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import frLocale from "@fullcalendar/core/locales/fr";

import { createClient } from "@/lib/supabase/client";
import { AppointmentModal } from "./appointment-modal";
import type { AppointmentStatus } from "@/types/database";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface CalendarViewProps {
  userId: string;
  patients: Patient[];
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
  className: string;
}

export function CalendarView({ userId, patients }: CalendarViewProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Create a map of patients for quick lookup
  const patientsMap = patients.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, Patient>);

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, status, motif, patient_id")
        .eq("user_id", userId);

      if (error) throw error;

      return data.map((apt): AppointmentEvent => {
        const patient = apt.patient_id ? patientsMap[apt.patient_id] : null;
        return {
          id: apt.id,
          title: patient
            ? `${patient.first_name} ${patient.last_name}`
            : apt.motif || "RDV",
          start: apt.start_time,
          end: apt.end_time,
          extendedProps: {
            status: apt.status as AppointmentStatus,
            patientId: apt.patient_id,
            patientName: patient
              ? `${patient.first_name} ${patient.last_name}`
              : "",
            motif: apt.motif,
          },
          className: `status-${apt.status}`,
        };
      });
    },
  });

  // Update appointment mutation (for drag & drop)
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      start,
      end,
    }: {
      id: string;
      start: string;
      end: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .update({
          start_time: start,
          end_time: end,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Rendez-vous déplacé");
    },
    onError: () => {
      toast.error("Erreur lors du déplacement");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  // Handle date selection (create new appointment)
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    setSelectedDateRange({ start: selectInfo.start, end: selectInfo.end });
    setIsModalOpen(true);
  }, []);

  // Handle event click (edit appointment)
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      extendedProps: event.extendedProps as AppointmentEvent["extendedProps"],
      className: event.classNames.join(" "),
    });
    setSelectedDateRange(null);
    setIsModalOpen(true);
  }, []);

  // Handle event drop (drag & drop)
  const handleEventDrop = useCallback(
    (dropInfo: EventDropArg) => {
      const event = dropInfo.event;
      updateMutation.mutate({
        id: event.id,
        start: event.startStr,
        end: event.endStr,
      });
    },
    [updateMutation]
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDateRange(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale={frLocale}
          events={appointments}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          editable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          height="auto"
          expandRows={true}
          stickyHeaderDates={true}
          nowIndicator={true}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          }}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          }}
        />
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userId={userId}
        patients={patients}
        selectedEvent={selectedEvent}
        selectedDateRange={selectedDateRange}
      />
    </>
  );
}
