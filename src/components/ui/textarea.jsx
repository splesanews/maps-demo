import { cn } from "../../lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[132px] w-full rounded-md border border-[var(--border-primary)] bg-white px-3 py-3 font-[var(--font-utility)] text-sm text-[var(--text-primary)] shadow-sm outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus-visible:border-[var(--interactive-primary-default)] focus-visible:ring-2 focus-visible:ring-[rgba(28,79,114,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
