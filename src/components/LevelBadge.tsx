import { useState } from "react";
import { CircleCheck, ShieldCheck } from "lucide-react";

import { badgeVariants } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { SkillLevel } from "@/types";

const VARIANT = {
  "self-declared": "outline",
  verified: "sky",
  proven: "mint",
} as const;

const ICON = {
  "self-declared": null,
  verified: ShieldCheck,
  proven: CircleCheck,
} as const;

interface LevelBadgeProps {
  level: SkillLevel;
  /** Text to show, e.g. a skill name. Defaults to the level name. */
  label?: string;
  className?: string;
}

/**
 * The one way to show a skill level:
 * Self-declared = grey outline, Verified = sky + shield, Proven = mint + check.
 * Opens its explanation on hover, focus or tap (tap matters on Android).
 */
export function LevelBadge({ level, label, className }: LevelBadgeProps) {
  const [open, setOpen] = useState(false);
  const Icon = ICON[level];
  const levelName = LEVEL_LABELS[level];
  const text = label ?? levelName;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        aria-label={label ? `${label}: ${levelName}. ${LEVEL_DESCRIPTIONS[level]}` : `${levelName}. ${LEVEL_DESCRIPTIONS[level]}`}
        onClick={(event) => {
          // Stop Radix closing on click so a tap toggles the tooltip instead.
          event.preventDefault();
          setOpen((value) => !value);
        }}
        className={cn(badgeVariants({ variant: VARIANT[level] }), "relative z-10 cursor-help", className)}
      >
        {Icon && <Icon aria-hidden />}
        {text}
      </TooltipTrigger>
      <TooltipContent>
        {label && <span className="font-semibold">{levelName}: </span>}
        {LEVEL_DESCRIPTIONS[level]}
      </TooltipContent>
    </Tooltip>
  );
}
