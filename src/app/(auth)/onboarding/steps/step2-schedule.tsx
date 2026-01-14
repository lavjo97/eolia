"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { WorkingHours, DaySchedule, TimeSlot } from "@/types/database";
import { DEFAULT_WORKING_HOURS } from "@/lib/utils";
import type { OnboardingData } from "../onboarding-wizard";

interface Step2ScheduleProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
] as const;

export function Step2Schedule({ data, updateData }: Step2ScheduleProps) {
  const workingHours = data.workingHours;

  const initializeWithDefaults = () => {
    updateData({ workingHours: DEFAULT_WORKING_HOURS });
  };

  const toggleDay = (day: keyof WorkingHours) => {
    const currentDay = workingHours[day] || { enabled: false, slots: [] };
    const newWorkingHours = {
      ...workingHours,
      [day]: {
        ...currentDay,
        enabled: !currentDay.enabled,
        slots: currentDay.enabled ? [] : [{ start: "09:00", end: "18:00" }],
      },
    };
    updateData({ workingHours: newWorkingHours });
  };

  const updateSlot = (
    day: keyof WorkingHours,
    slotIndex: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    const currentDay = workingHours[day];
    if (!currentDay) return;

    const newSlots = [...currentDay.slots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };

    updateData({
      workingHours: {
        ...workingHours,
        [day]: { ...currentDay, slots: newSlots },
      },
    });
  };

  const addSlot = (day: keyof WorkingHours) => {
    const currentDay = workingHours[day];
    if (!currentDay) return;

    const lastSlot = currentDay.slots[currentDay.slots.length - 1];
    const newStart = lastSlot ? lastSlot.end : "14:00";

    updateData({
      workingHours: {
        ...workingHours,
        [day]: {
          ...currentDay,
          slots: [...currentDay.slots, { start: newStart, end: "18:00" }],
        },
      },
    });
  };

  const removeSlot = (day: keyof WorkingHours, slotIndex: number) => {
    const currentDay = workingHours[day];
    if (!currentDay || currentDay.slots.length <= 1) return;

    const newSlots = currentDay.slots.filter((_, i) => i !== slotIndex);
    updateData({
      workingHours: {
        ...workingHours,
        [day]: { ...currentDay, slots: newSlots },
      },
    });
  };

  const hasAnySchedule = Object.values(workingHours).some((day) => day?.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Vos horaires de travail</h3>
          <p className="text-sm text-muted-foreground">
            Définissez les créneaux où vous pouvez recevoir des patients
          </p>
        </div>
        {!hasAnySchedule && (
          <Button variant="outline" size="sm" onClick={initializeWithDefaults}>
            Horaires classiques
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {DAYS.map(({ key, label }) => {
          const daySchedule = workingHours[key] as DaySchedule | undefined;
          const isEnabled = daySchedule?.enabled ?? false;

          return (
            <div
              key={key}
              className={`rounded-lg border p-4 transition-colors ${
                isEnabled ? "border-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleDay(key)}
                    id={`day-${key}`}
                  />
                  <Label htmlFor={`day-${key}`} className="font-medium">
                    {label}
                  </Label>
                </div>
              </div>

              {isEnabled && daySchedule && (
                <div className="mt-4 space-y-2">
                  {daySchedule.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          updateSlot(key, slotIndex, "start", e.target.value)
                        }
                        className="w-[120px]"
                      />
                      <span className="text-muted-foreground">à</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          updateSlot(key, slotIndex, "end", e.target.value)
                        }
                        className="w-[120px]"
                      />
                      {daySchedule.slots.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(key, slotIndex)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(key)}
                    className="text-primary"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Ajouter un créneau
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Vous pourrez modifier ces horaires à tout moment depuis les paramètres
      </p>
    </div>
  );
}
