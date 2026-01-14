"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIALTIES } from "@/types/database";
import type { OnboardingData } from "../onboarding-wizard";

interface Step1ProfileProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

export function Step1Profile({ data, updateData }: Step1ProfileProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Votre nom complet *</Label>
        <Input
          id="name"
          placeholder="Dr. Marie Dupont"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Ce nom apparaîtra sur votre page de réservation et vos factures
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Nom du cabinet (optionnel)</Label>
        <Input
          id="businessName"
          placeholder="Cabinet Bien-Être Horizon"
          value={data.businessName}
          onChange={(e) => updateData({ businessName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialty">Spécialité *</Label>
        <Select
          value={data.specialty}
          onValueChange={(value) => updateData({ specialty: value })}
        >
          <SelectTrigger id="specialty">
            <SelectValue placeholder="Sélectionnez votre spécialité" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone (optionnel)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="06 12 34 56 78"
          value={data.phone}
          onChange={(e) => updateData({ phone: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Sera affiché sur votre page de réservation pour les urgences
        </p>
      </div>
    </div>
  );
}
