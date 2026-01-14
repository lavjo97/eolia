"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingData } from "../onboarding-wizard";

interface Step3UsernameProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  userId: string;
}

export function Step3Username({ data, updateData, userId }: Step3UsernameProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.eolia.fr";
  const cleanUsername = data.username.toLowerCase().replace(/[^a-z0-9-]/g, "");

  useEffect(() => {
    if (cleanUsername.length < 3) {
      setIsAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setIsChecking(true);
      
      try {
        const supabase = createClient();
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .neq("id", userId)
          .single();
        
        setIsAvailable(!existing);
      } catch {
        // Si erreur (pas trouvé), le username est disponible
        setIsAvailable(true);
      } finally {
        setIsChecking(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [cleanUsername, userId]);

  const handleUsernameChange = (value: string) => {
    // Ne garder que les caractères alphanumériques et tirets
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    updateData({ username: cleaned });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Votre URL de réservation</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center rounded-md border border-input bg-background">
              <span className="px-3 text-sm text-muted-foreground">
                {baseUrl.replace("https://", "")}/reserver/
              </span>
              <Input
                id="username"
                value={data.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="votre-nom"
                className="border-0 pl-0 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="w-8">
            {isChecking && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            {!isChecking && isAvailable === true && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {!isChecking && isAvailable === false && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
        </div>
        
        {cleanUsername.length > 0 && cleanUsername.length < 3 && (
          <p className="text-sm text-muted-foreground">
            Minimum 3 caractères
          </p>
        )}
        {!isChecking && isAvailable === false && (
          <p className="text-sm text-destructive">
            Ce nom d&apos;utilisateur est déjà pris
          </p>
        )}
        {!isChecking && isAvailable === true && (
          <p className="text-sm text-green-600">
            Parfait ! Cette URL est disponible
          </p>
        )}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-medium">Prévisualisation</h4>
        <p className="text-sm text-muted-foreground">
          Vos patients pourront réserver en se rendant sur :
        </p>
        <p className="mt-1 font-mono text-sm text-primary">
          {baseUrl}/reserver/{cleanUsername || "votre-nom"}
        </p>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>💡 Conseils pour un bon username :</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Utilisez votre nom ou celui de votre cabinet</li>
          <li>Évitez les caractères spéciaux</li>
          <li>Gardez-le court et mémorable</li>
        </ul>
      </div>
    </div>
  );
}
