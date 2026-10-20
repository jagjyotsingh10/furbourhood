import { Link } from "react-router-dom";
import { Bell, ChevronRight, CircleHelp, CreditCard, LogOut, Palette, type LucideIcon } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui/card";
import { demoOwner } from "@/mocks";

const ROWS: { label: string; hint: string; icon: LucideIcon; to?: string }[] = [
  { label: "Payment methods", hint: "Coming later", icon: CreditCard },
  { label: "Notifications", hint: "Booking updates", icon: Bell },
  { label: "Help", hint: "Questions and safety", icon: CircleHelp },
  { label: "Style guide", hint: "Colours, type and components", icon: Palette, to: "/styleguide" },
  { label: "Log out", hint: "Back to the welcome screen", icon: LogOut, to: "/" },
];

export function Profile() {
  return (
    <>
      <AppBar title="Profile" />
      <ScreenBody>
        <Card className="flex items-center gap-4 p-4">
          <Avatar name={demoOwner.name} tone="navy" size="lg" />
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-extrabold">{demoOwner.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{demoOwner.email}</p>
            <p className="text-sm text-muted-foreground">
              {demoOwner.area.name} · {demoOwner.area.fsa}
            </p>
          </div>
        </Card>

        <Card>
          <ul className="divide-y">
            {ROWS.map(({ label, hint, icon: Icon, to }) => {
              const content = (
                <>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-tint">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{label}</span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                  {to && <ChevronRight className="size-4" aria-hidden />}
                </>
              );
              return (
                <li key={label}>
                  {to ? (
                    <Link to={to} className="flex items-center gap-3 px-4 py-3 hover:bg-sky-tint/50">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
        <DemoNote>Demo account. Sign-in comes in a later version.</DemoNote>
      </ScreenBody>
    </>
  );
}
