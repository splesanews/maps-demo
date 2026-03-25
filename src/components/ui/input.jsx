import { cn } from "../../lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-[var(--border-primary)] bg-white px-3 py-2 font-[var(--font-utility)] text-sm text-[var(--text-primary)] shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:font-[var(--font-utility)] file:text-sm file:font-medium placeholder:text-[var(--text-tertiary)] focus-visible:border-[var(--interactive-primary-default)] focus-visible:ring-2 focus-visible:ring-[rgba(28,79,114,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
