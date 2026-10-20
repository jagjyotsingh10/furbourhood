import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Text is always navy on sky, mint and coral fills; white only on navy.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        outline: "border-slate bg-card text-slate",
        sky: "border-transparent bg-sky text-navy",
        mint: "border-transparent bg-mint text-navy",
        coral: "border-transparent bg-coral text-navy",
        navy: "border-transparent bg-navy text-white",
        muted: "border-transparent bg-muted text-navy",
      },
    },
    defaultVariants: { variant: "muted" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
