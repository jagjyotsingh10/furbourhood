import { Link, useLocation } from "react-router-dom";
import { CalendarDays, ClipboardList, Inbox, PawPrint, Search, UserRound, type LucideIcon } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Other routes that belong to this tab */
  match: string[];
}

const OWNER_TABS: Tab[] = [
  { to: "/find", label: "Find care", icon: Search, match: ["/find", "/results", "/providers"] },
  { to: "/bookings", label: "Bookings", icon: CalendarDays, match: ["/bookings"] },
  { to: "/pets", label: "My pets", icon: PawPrint, match: ["/pets"] },
  { to: "/profile", label: "Profile", icon: UserRound, match: ["/profile", "/styleguide"] },
];

const PROVIDER_TABS: Tab[] = [
  { to: "/requests", label: "Requests", icon: Inbox, match: ["/requests"] },
  { to: "/listing", label: "My listing", icon: ClipboardList, match: ["/listing", "/providers"] },
  { to: "/profile", label: "Profile", icon: UserRound, match: ["/profile", "/styleguide"] },
];

export function BottomTabs() {
  const { pathname } = useLocation();
  const { role } = useAuth();
  const tabs = role === "provider" ? PROVIDER_TABS : OWNER_TABS;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className={cn("grid h-[4.25rem]", tabs.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
        {tabs.map(({ to, label, icon: Icon, match }) => {
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
