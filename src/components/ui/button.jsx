import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--interactive-primary-default)] text-white hover:bg-[var(--interactive-primary-hover)]",
        outline:
          "border border-[var(--border-primary)] bg-white text-[var(--interactive-primary-default)] hover:bg-[var(--surface-secondary)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 px-5 py-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
