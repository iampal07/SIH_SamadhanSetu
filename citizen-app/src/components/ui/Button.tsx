"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark active:bg-brand-dark disabled:bg-slate-300",
  secondary:
    "bg-white text-brand border-2 border-brand hover:bg-emerald-50 disabled:border-slate-300 disabled:text-slate-400",
  outline:
    "bg-transparent text-slate-700 border-2 border-slate-300 hover:bg-slate-100 disabled:text-slate-400",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", fullWidth = true, className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={[
        "min-h-14 rounded-xl px-6 text-lg font-semibold transition-colors",
        "disabled:cursor-not-allowed",
        fullWidth ? "w-full" : "",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
});
