"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { WorkingHours, Json } from "@/types/database";

import { Step1Profile } from "./steps/step1-profile";
import { Step2Schedule } from "./steps/step2-schedule";
import { Step3Username } from "./steps/step3-username";

interface OnboardingWizardProps {
  userId: string;
  initialData: {
    name: string;
    businessName: string;
    specialty: string;
    phone: string;
    workingHours: WorkingHours;
    username: string;
  };
}

export interface OnboardingData {
  name: string;
  businessName: string;
  specialty: string;
  phone: string;
  workingHours: WorkingHours;
  username: string;
}

const STEPS = [
  { id: 1, title: "Votre cabinet", description: "Informations de base" },
  { id: 2, title: "Vos horaires", description: "Disponibilités" },
  { id: 3, title: "Votre URL", description: "Page de réservation" },
];

export function OnboardingWizard({ userId, initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name.trim() && data.specialty;
      case 2:
        return Object.values(data.workingHours).some((day) => day?.enabled);
      case 3:
        return data.username.trim().length >= 3;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!canProceed()) return;
    
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      // Vérifier si le username est disponible
      const { data: existingUsername } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", data.username.toLowerCase())
        .neq("id", userId)
        .single();
      
      if (existingUsername) {
        toast.error("Ce nom d'utilisateur est déjà pris");
        setIsLoading(false);
        return;
      }
      
      // Mettre à jour le profil
      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          company_name: data.businessName || null,
          specialty: data.specialty,
          phone: data.phone || null,
          working_hours: data.workingHours as unknown as Json,
          username: data.username.toLowerCase(),
        })
        .eq("id", userId);
      
      if (error) {
        throw error;
      }
      
      toast.success("Votre cabinet est prêt !");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-1 flex-col items-center ${
                index < STEPS.length - 1 ? "relative" : ""
              }`}
            >
              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              
              {/* Step Circle */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary bg-background text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <Step1Profile data={data} updateData={updateData} />
        )}
        {currentStep === 2 && (
          <Step2Schedule data={data} updateData={updateData} />
        )}
        {currentStep === 3 && (
          <Step3Username data={data} updateData={updateData} userId={userId} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        {currentStep < 3 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!canProceed() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Terminer
            <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
