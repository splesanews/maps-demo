import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "../../lib/utils";

function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "font-[var(--font-utility)] text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

export { Label };
