"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ExternalLink, Copy, Bell, Mail, Smartphone, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { createClient } from "@/lib/supabase/client";
import { SPECIALTIES } from "@/types/database";
import type { Profile } from "@/types/database";

interface SettingsFormProps {
  profile: Profile | null;
  userId: string;
}

const settingsSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  businessName: z.string().optional(),
  specialty: z.string().min(1, "Spécialité requise"),
  phone: z.string().optional(),
  username: z.string().min(3, "Minimum 3 caractères"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ profile, userId }: SettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reserver/${profile?.username || ""}`;

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: profile?.name || "",
      businessName: profile?.company_name || "",
      specialty: profile?.specialty || "",
      phone: profile?.phone || "",
      username: profile?.username || "",
    },
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast.success("URL copiée !");
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Check if username is available
      if (data.username !== profile?.username) {
        const { data: existingUsername } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", data.username.toLowerCase())
          .neq("id", userId)
          .single();

        if (existingUsername) {
          toast.error("Ce nom d'utilisateur est déjà pris");
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          company_name: data.businessName || null,
          specialty: data.specialty,
          phone: data.phone || null,
          username: data.username.toLowerCase(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Paramètres enregistrés");
      router.refresh();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Booking URL */}
      <Card>
        <CardHeader>
          <CardTitle>Page de réservation</CardTitle>
          <CardDescription>
            Partagez cette URL avec vos patients pour qu&apos;ils puissent prendre rendez-vous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={bookingUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du cabinet</CardTitle>
          <CardDescription>
            Ces informations apparaissent sur votre page de réservation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Votre nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du cabinet (optionnel)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécialité</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPECIALTIES.map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>
                            {specialty}
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone (optionnel)</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormDescription>
                      Affiché sur votre page de réservation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d&apos;utilisateur</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Utilisé dans l&apos;URL de votre page de réservation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications automatiques
          </CardTitle>
          <CardDescription>
            Vos patients reçoivent automatiquement des notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email de confirmation */}
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-green-50 border-green-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-green-900">Email de confirmation</h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Actif
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Un email est envoyé automatiquement après chaque prise de rendez-vous avec tous les détails.
              </p>
            </div>
          </div>

          {/* Rappel SMS */}
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-amber-50 border-amber-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-amber-900">Rappel SMS (24h avant)</h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Actif
                </span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Un SMS de rappel est envoyé automatiquement 24 heures avant chaque rendez-vous.
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p className="font-medium mb-1">💡 Bon à savoir</p>
            <p>
              Les notifications réduisent de 80% les rendez-vous manqués. 
              Pour activer les SMS, contactez-nous pour configurer votre compte Twilio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
