import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container relative min-h-screen flex flex-col items-center justify-center px-4 py-12 lg:px-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          {/* Logo EOLIA */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 40 40"
                className="h-10 w-10 text-primary"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M12 20C12 15.5817 15.5817 12 20 12C24.4183 12 28 15.5817 28 20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 20C16 17.7909 17.7909 16 20 16C22.2091 16 24 17.7909 24 20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="20" r="2" fill="currentColor" />
                <path
                  d="M20 22V28"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                EOLIA
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Assistant administratif pour praticiens du bien-être
            </p>
          </div>
          
          {children}
          
          {/* Footer */}
          <p className="px-8 text-center text-xs text-muted-foreground">
            En continuant, vous acceptez nos{" "}
            <a href="/cgu" className="underline underline-offset-4 hover:text-primary">
              Conditions d&apos;utilisation
            </a>{" "}
            et notre{" "}
            <a href="/confidentialite" className="underline underline-offset-4 hover:text-primary">
              Politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
