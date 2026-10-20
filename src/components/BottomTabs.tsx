import { Link, useLocation } from "react-router-dom";
import { CalendarDays, PawPrint, Search, UserRound, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Other routes that belong to this tab */
  match: string[];
}

const TABS: Tab[] = [
  { to: "/find", label: "Find care", icon: Search, match: ["/find", "/results", "/providers"] },
  { to: "/bookings", label: "Bookings", icon: CalendarDays, match: ["/bookings"] },
  { to: "/pets", label: "My pets", icon: PawPrint, match: ["/pets"] },
  { to: "/profile", label: "Profile", icon: UserRound, match: ["/profile", "/styleguide"] },
];

export function BottomTabs() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid h-[4.25rem] grid-cols-4">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match.some((path) => pathname.startsWith(path));
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className="flex h-full flex-col items-center justify-center gap-1 text-xs focus-visible:outline-offset-[-4px]"
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-sky text-navy" : "text-slate",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className={cn(active ? "font-bold text-navy" : "font-medium text-slate")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
