import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-charcoal placeholder:text-muted/70 " +
  "transition-colors duration-150 hover:border-line-strong focus:border-charcoal focus:outline-none " +
  "aria-[invalid=true]:border-danger";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ id, label, hint, error, optional, children, className = "" }: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
};

export function TextField({ id, label, hint, error, optional, wrapperClassName, className = "", ...props }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <input
        id={id}
        name={props.name ?? id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${control} h-12 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

type TextAreaProps = ComponentProps<"textarea"> & {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
};

export function TextAreaField({ id, label, hint, error, optional, wrapperClassName, className = "", ...props }: TextAreaProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <textarea
        id={id}
        name={props.name ?? id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${control} min-h-24 py-3 leading-relaxed ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

type SelectProps = ComponentProps<"select"> & {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
};

export function SelectField({ id, label, hint, error, wrapperClassName, className = "", children, ...props }: SelectProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select
        id={id}
        name={props.name ?? id}
        aria-invalid={error ? true : undefined}
        className={`${control} h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%232a2623' stroke-width='1.5'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")] bg-[position:right_1rem_center] bg-no-repeat pr-10 ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
