"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useDialog } from "@/components/shop/use-dialog";
import { Button } from "./button";

// Meludelu's own confirmation window. Use this instead of the browser's confirm()/alert().

export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions;
  onClose: (confirmed: boolean) => void;
}) {
  const cancel = useCallback(() => onClose(false), [onClose]);
  const panelRef = useDialog(true, cancel);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end p-3 sm:place-items-center sm:p-6">
      <button type="button" aria-label="Close" onClick={cancel} className="absolute inset-0 animate-fade-in bg-charcoal/30 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.body ? "confirm-body" : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md animate-slide-up rounded-[var(--radius-panel)] bg-ivory p-6 shadow-[var(--shadow-lift)] outline-none sm:p-7"
      >
        <h2 id="confirm-title" className="font-serif text-[28px] leading-tight">
          {options.title}
        </h2>
        {options.body && (
          <div id="confirm-body" className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">
            {options.body}
          </div>
        )}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={cancel}>
            {options.cancelLabel ?? "Go back"}
          </Button>
          <Button
            onClick={() => onClose(true)}
            className={options.tone === "danger" ? "!bg-danger hover:!bg-danger/90" : ""}
            autoFocus
          >
            {options.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * const [confirmDialog, confirm] = useConfirm();
 * if (await confirm({ title: "Cancel order?", confirmLabel: "Cancel order" })) { ... }
 * Render {confirmDialog} somewhere in the component.
 */
export function useConfirm(): [ReactNode, (options: ConfirmOptions) => Promise<boolean>] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOptions(null);
  }, []);

  return [options ? <ConfirmDialog options={options} onClose={close} /> : null, confirm];
}
