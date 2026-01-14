import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <svg
            viewBox="0 0 40 40"
            className="h-10 w-10 text-primary"
            fill="none"
          >
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="20" cy="20" r="2" fill="currentColor" />
            <path d="M20 22V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-2xl font-bold">EOLIA</span>
        </div>
        
        <h1 className="mb-2 text-4xl font-bold">Praticien non trouvé</h1>
        <p className="mb-8 text-muted-foreground">
          Ce praticien n&apos;existe pas ou n&apos;a pas encore configuré sa page de réservation.
        </p>
        
        <Link href="/">
          <Button>Retour à l&apos;accueil</Button>
        </Link>
      </div>
    </div>
  );
}
