import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HandHeart, PawPrint, type LucideIcon } from "lucide-react";

import { PhoneFrame } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "owner" | "provider";

const ROLES: { id: Role; title: string; hint: string; icon: LucideIcon }[] = [
  { id: "owner", title: "I'm a pet owner", hint: "Find trusted care nearby", icon: PawPrint },
  { id: "provider", title: "I'm a care provider", hint: "Offer walks, visits and stays", icon: HandHeart },
];

export function Welcome() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("owner");

  // Static MVP: both paths land on the owner home for now.
  const start = () => navigate("/find");

  return (
    <PhoneFrame>
      <main className="flex min-h-dvh flex-col px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {/* The logo file includes the tagline; crop it off and render the tagline as real, high-contrast text. */}
          <div className="w-full max-w-80 overflow-hidden" style={{ aspectRatio: "882 / 160" }}>
            <img src="/brand/furbourhood-logo.png" alt="Furbourhood" className="w-full" />
          </div>
          <p className="mt-3 font-heading text-lg font-bold tracking-[0.2em] uppercase">Care · Connect · Explore</p>
          <p className="mt-4 max-w-72 text-base text-muted-foreground">
            Pet care from neighbours you can trust, across Windsor-Essex.
          </p>
        </div>

        <fieldset className="mt-8">
          <legend className="mb-3 font-heading text-base font-bold">How will you use Furbourhood?</legend>
          <div className="grid gap-3" role="radiogroup">
            {ROLES.map(({ id, title, hint, icon: Icon }) => {
              const selected = role === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(id)}
                  className={cn(
                    "flex items-center gap-3 rounded-card border-2 p-4 text-left shadow-card transition-colors",
                    selected ? "border-navy bg-sky" : "border-transparent bg-card hover:border-sky",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full",
                      selected ? "bg-white/70" : "bg-sky-tint",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className={cn("block text-sm", selected ? "text-navy" : "text-muted-foreground")}>
                      {hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-3">
          <Button size="lg" onClick={start}>
            Sign up
          </Button>
          <Button size="lg" variant="outline" onClick={start}>
            Log in
          </Button>
        </div>
      </main>
    </PhoneFrame>
  );
}
