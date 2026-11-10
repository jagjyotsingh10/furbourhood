import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, CircleHelp, CreditCard, LogOut, Palette, type LucideIcon } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { ErrorState, LoadingState } from "@/components/States";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/data/hooks";
import { AREAS } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

const ROLE_LABEL = { owner: "Pet owner", provider: "Care provider" } as const;

function RowContent({ label, hint, icon: Icon, chevron }: { label: string; hint: string; icon: LucideIcon; chevron?: boolean }) {
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-tint">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      {chevron && <ChevronRight className="size-4" aria-hidden />}
    </>
  );
}

const ROW_CLASS = "flex w-full items-center gap-3 px-4 py-3";

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, loading, error, reload } = useProfile();
  const [signingOut, setSigningOut] = useState(false);

  const logOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const name = profile?.fullName || user?.email || "You";

  return (
    <>
      <AppBar title="Profile" />
      <ScreenBody>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <Card className="flex items-center gap-4 p-4">
            <Avatar name={name} tone="navy" size="lg" />
            <div className="min-w-0">
              <h2 className="truncate font-heading text-xl font-extrabold">{name}</h2>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                {profile ? ROLE_LABEL[profile.role] : ""}
                {profile?.areaFsa && ` · ${AREAS[profile.areaFsa] ?? "Windsor-Essex"} · ${profile.areaFsa}`}
              </p>
            </div>
          </Card>
        )}

        {profile?.role === "provider" && (
          <p className="rounded-card bg-sky-tint p-4 text-sm">
            Provider tools (your listing, availability and requests) are coming next. For now you can browse as an
            owner would.
          </p>
        )}

        <Card>
          <ul className="divide-y">
            <li>
              <div className={ROW_CLASS}>
                <RowContent label="Payment methods" hint="Coming later" icon={CreditCard} />
              </div>
            </li>
            <li>
              <div className={ROW_CLASS}>
                <RowContent label="Notifications" hint="Booking updates" icon={Bell} />
              </div>
            </li>
            <li>
              <div className={ROW_CLASS}>
                <RowContent label="Help" hint="Questions and safety" icon={CircleHelp} />
              </div>
            </li>
            <li>
              <Link to="/styleguide" className={`${ROW_CLASS} hover:bg-sky-tint/50`}>
                <RowContent label="Style guide" hint="Colours, type and components" icon={Palette} chevron />
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={logOut}
                disabled={signingOut}
                className={`${ROW_CLASS} rounded-b-card hover:bg-sky-tint/50 disabled:opacity-60`}
              >
                <RowContent label={signingOut ? "Logging out…" : "Log out"} hint="Back to the welcome screen" icon={LogOut} />
              </button>
            </li>
          </ul>
        </Card>
        <DemoNote>Providers, reviews, and your starter pets and bookings are demo data.</DemoNote>
      </ScreenBody>
    </>
  );
}
