import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "../../lib/utils";

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-[rgba(39,23,17,0.14)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(28,79,114,0.18)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--interactive-primary-default)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
