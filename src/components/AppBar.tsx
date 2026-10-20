import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AppBarProps {
  title: string;
  /** Show a back button. A string is the route to go to; true goes back in history. */
  back?: boolean | string;
  actions?: ReactNode;
}

export function AppBar({ title, back, actions }: AppBarProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b bg-cloud/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-2">
        {back ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
          >
            <ChevronLeft className="size-6!" aria-hidden />
          </Button>
        ) : (
          <span className="w-2" aria-hidden />
        )}
        <img src="/brand/furbourhood-mark.png" alt="" className="size-8 shrink-0" />
        <h1 className="min-w-0 flex-1 truncate font-heading text-xl font-extrabold">{title}</h1>
        {actions}
      </div>
    </header>
  );
}
