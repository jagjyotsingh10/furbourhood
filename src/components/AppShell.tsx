import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Info } from "lucide-react";

import { BottomTabs } from "@/components/BottomTabs";
import { cn } from "@/lib/utils";

/** Phone-width frame: max 480px, centred on larger screens. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-dvh max-w-[480px] bg-background min-[481px]:border-x">{children}</div>;
}

/** Layout for signed-in owner screens: content plus the bottom tab bar. */
export function AppShell() {
  const { pathname } = useLocation();

  // New screens open at the top, like native navigation.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <PhoneFrame>
      <Outlet />
      <BottomTabs />
    </PhoneFrame>
  );
}

/** Page body that clears the bottom tabs (and an optional sticky action bar). */
export function ScreenBody({
  children,
  className,
  withActionBar = false,
}: {
  children: ReactNode;
  className?: string;
  withActionBar?: boolean;
}) {
  return (
    <main className={cn("flex flex-col gap-4 px-4 pt-4", withActionBar ? "pb-44" : "pb-28", className)}>
      {children}
    </main>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-heading text-lg font-bold", className)}>{children}</h2>;
}

export function DemoNote({ children = "Demo data: people, pets and reviews are fictional." }: { children?: ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
