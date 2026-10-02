import type { ReactNode } from "react";

export function AdminHeader({ title, intro, action }: { title: string; intro?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[38px] leading-none lg:text-[46px]">{title}</h1>
        {intro && <p className="mt-2 text-[14.5px] text-muted">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "", action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-[var(--radius-card)] bg-ivory p-5 ring-1 ring-line lg:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-medium">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
