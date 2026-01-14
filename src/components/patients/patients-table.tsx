"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Phone, Mail } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPhoneNumber } from "@/lib/utils";
import { EditPatientDialog } from "./edit-patient-dialog";
import { DeletePatientDialog } from "./delete-patient-dialog";
import type { Patient } from "@/types/database";

interface PatientWithCount extends Patient {
  appointmentCount: number;
}

interface PatientsTableProps {
  patients: PatientWithCount[];
  userId: string;
}

export function PatientsTable({ patients, userId }: PatientsTableProps) {
  const [search, setSearch] = useState("");
  const [editingPatient, setEditingPatient] = useState<PatientWithCount | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<PatientWithCount | null>(null);

  const filteredPatients = patients.filter((patient) => {
    const searchLower = search.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.phone.includes(search)
    );
  });

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-primary/10 p-4">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold">Aucun patient</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Commencez par ajouter votre premier patient ou attendez qu&apos;un patient
            prenne rendez-vous via votre page de réservation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Input
          placeholder="Rechercher un patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="secondary">
          {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""}
        </Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>RDV</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {patient.first_name.charAt(0)}
                      {patient.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </p>
                      {patient.notes && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {patient.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <a
                      href={`mailto:${patient.email}`}
                      className="flex items-center gap-1 text-sm hover:text-primary"
                    >
                      <Mail className="h-3 w-3" />
                      {patient.email}
                    </a>
                    <a
                      href={`tel:${patient.phone}`}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Phone className="h-3 w-3" />
                      {formatPhoneNumber(patient.phone)}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{patient.appointmentCount}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {patient.created_at ? formatDate(patient.created_at, "d MMM yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPatient(patient)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingPatient(patient)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {editingPatient && (
        <EditPatientDialog
          patient={editingPatient}
          userId={userId}
          isOpen={!!editingPatient}
          onClose={() => setEditingPatient(null)}
        />
      )}

      {deletingPatient && (
        <DeletePatientDialog
          patient={deletingPatient}
          isOpen={!!deletingPatient}
          onClose={() => setDeletingPatient(null)}
        />
      )}
    </>
  );
}
