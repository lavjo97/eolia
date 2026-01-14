import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 40 40"
              className="h-8 w-8 text-primary"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M12 20C12 15.5817 15.5817 12 20 12C24.4183 12 28 15.5817 28 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 20C16 17.7909 17.7909 16 20 16C22.2091 16 24 17.7909 24 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
              <path d="M20 22V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold">EOLIA</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Essai gratuit</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            ✨ Essai gratuit pendant 14 jours
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Gérez votre cabinet
            <span className="block text-primary">en toute sérénité</span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            EOLIA automatise la gestion de vos rendez-vous, envoie des rappels à vos patients
            et génère vos factures. Finis les &quot;lapins&quot; et la paperasse !
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Voir la démo
              </Button>
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            Configuration en moins de 10 minutes • Aucune carte bancaire requise
          </p>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Tout ce dont vous avez besoin
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-0 bg-card/50 shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Calendrier intelligent</h3>
                <p className="text-muted-foreground">
                  Visualisez et gérez tous vos rendez-vous en un coup d&apos;œil.
                  Drag & drop pour déplacer facilement.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card/50 shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Rappels SMS automatiques</h3>
                <p className="text-muted-foreground">
                  Réduisez les absences de 70% grâce aux rappels automatiques
                  envoyés 24h avant chaque rendez-vous.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card/50 shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Facturation automatique</h3>
                <p className="text-muted-foreground">
                  Générez et envoyez vos factures en un clic. Conformes aux
                  normes françaises.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mx-auto mt-24 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Un prix simple et transparent</h2>
          <p className="mb-8 text-muted-foreground">
            Tout compris, sans engagement, sans surprise.
          </p>
          
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-8">
              <div className="mb-6">
                <span className="text-5xl font-bold">29€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              
              <ul className="mb-8 space-y-3 text-left">
                {[
                  "Patients illimités",
                  "Rendez-vous illimités",
                  "Page de réservation publique",
                  "Rappels SMS automatiques",
                  "Facturation PDF",
                  "Support prioritaire",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link href="/register">
                <Button size="lg" className="w-full">
                  Essayer gratuitement pendant 14 jours
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 40 40"
                className="h-6 w-6 text-primary"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </svg>
              <span className="font-semibold">EOLIA</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EOLIA. Tous droits réservés.
            </p>
            
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/cgu" className="hover:text-primary">CGU</Link>
              <Link href="/confidentialite" className="hover:text-primary">Confidentialité</Link>
              <Link href="/contact" className="hover:text-primary">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
