"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientFormDialog } from "./patient-form-dialog";

interface AddPatientButtonProps {
  userId: string;
}

export function AddPatientButton({ userId }: AddPatientButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nouveau patient
      </Button>
      
      <PatientFormDialog
        userId={userId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
