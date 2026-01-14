"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  FileText,
  Settings,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface DashboardSidebarProps {
  profile: Profile;
}

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendrier", href: "/dashboard/calendar", icon: Calendar },
  { name: "Patients", href: "/dashboard/patients", icon: Users },
  { name: "Factures", href: "/dashboard/invoices", icon: FileText },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const bookingUrl = `/reserver/${profile.username}`;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <svg
            viewBox="0 0 40 40"
            className="h-8 w-8 text-sidebar-primary"
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
          <span className="text-lg font-bold text-sidebar-foreground">EOLIA</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Booking Link */}
        <div className="border-t p-4">
          <Link
            href={bookingUrl}
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
          >
            <ExternalLink className="h-4 w-4" />
            <div className="flex-1 truncate">
              <p className="font-medium text-sidebar-foreground">Page de réservation</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                /reserver/{profile.username}
              </p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              {profile.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {profile.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {profile.specialty}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
