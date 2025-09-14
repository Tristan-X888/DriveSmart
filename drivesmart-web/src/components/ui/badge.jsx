import React from "react";

/**
 * Minimal Badge component (shadcn-style API).
 * Variants: "default" | "secondary" | "outline" (default: outline)
 */
export function Badge({ children, variant = "outline", className = "", ...props }) {
  const base =
    "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium";
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "border-border text-foreground",
  };
  const styles = variants[variant] ?? variants.outline;
  return (
    <span className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;
