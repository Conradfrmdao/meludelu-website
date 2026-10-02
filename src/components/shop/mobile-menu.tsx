"use client";

import Link from "next/link";
import { CloseIcon } from "@/components/ui/icons";
import { helpNav, primaryNav } from "./nav-links";
import { useDialog } from "./use-dialog";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useDialog(open, onClose);
  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-ivory outline-none lg:hidden"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <span className="font-serif text-[22px] tracking-[0.22em]">MELUDELU</span>
        <button type="button" onClick={onClose} aria-label="Close menu" className="-mr-2 grid size-10 place-items-center">
          <CloseIcon />
        </button>
      </div>
      <nav aria-label="Menu" className="flex flex-1 flex-col overflow-y-auto px-6 pb-10 pt-6">
        <ul className="space-y-1">
          {primaryNav.map((item, i) => (
            <li key={item.href} className="animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
              <Link href={item.href} onClick={onClose} className="block py-2 font-serif text-[40px] leading-tight">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t border-line pt-6">
          <ul className="grid grid-cols-2 gap-y-3 text-[14px] text-ink-soft">
            {helpNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={onClose}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
