import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Factures",
  description: "Gérez vos factures",
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
        <p className="text-muted-foreground">
          Gérez et téléchargez vos factures
        </p>
      </div>
      
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-primary/10 p-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Bientôt disponible</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-md">
            La génération automatique de factures sera disponible dans la prochaine
            mise à jour. Vous pourrez générer des factures conformes aux normes
            françaises directement depuis vos rendez-vous terminés.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
