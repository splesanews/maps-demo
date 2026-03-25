import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../../lib/utils";

function Slider({ className, ...props }) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[rgba(28,79,114,0.14)]">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--interactive-primary-default)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-white bg-[var(--interactive-primary-default)] shadow-[0_6px_16px_rgba(28,79,114,0.3)] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(28,79,114,0.18)] disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
