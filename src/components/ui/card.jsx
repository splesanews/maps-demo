import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] shadow-[0_20px_55px_rgba(39,23,17,0.06)]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("space-y-1.5 p-5 pb-3", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        "font-[var(--font-brand)] text-[26px] leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        "font-[var(--font-utility)] text-sm leading-6 text-[var(--text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
