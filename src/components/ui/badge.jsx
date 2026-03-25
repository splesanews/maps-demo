import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-full border px-3 py-1 font-[var(--font-utility)] text-[11px] font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        outline:
          "border-[rgba(28,79,114,0.16)] bg-[rgba(28,79,114,0.08)] text-[var(--interactive-primary-default)]",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
