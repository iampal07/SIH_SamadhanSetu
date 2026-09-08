"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

function FieldWrapper({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-semibold text-slate-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </label>
  );
}

const inputBase =
  "w-full min-h-14 rounded-xl border-2 px-4 text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none";

function borderClass(error?: string) {
  return error
    ? "border-red-500 focus:border-red-500"
    : "border-slate-300 focus:border-brand";
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

export function TextField({ label, required, hint, error, className = "", ...props }: TextFieldProps) {
  return (
    <FieldWrapper label={label} required={required} hint={hint} error={error}>
      <input className={`${inputBase} ${borderClass(error)} ${className}`} {...props} />
    </FieldWrapper>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

export function TextAreaField({ label, required, hint, error, className = "", ...props }: TextAreaProps) {
  return (
    <FieldWrapper label={label} required={required} hint={hint} error={error}>
      <textarea
        className={`${inputBase} min-h-32 py-3 ${borderClass(error)} ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

export function SelectField({ label, required, hint, error, className = "", children, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} required={required} hint={hint} error={error}>
      <select className={`${inputBase} bg-white ${borderClass(error)} ${className}`} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}
