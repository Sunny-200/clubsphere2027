"use client";

import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, children, widthClass = "max-w-3xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={cn(
          "relative w-full rounded-2xl bg-linear-to-b from-zinc-900/90 to-black/90 border border-white/10 shadow-2xl",
          widthClass
        )}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          >
            Close
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 text-sm text-neutral-100">{children}</div>
      </div>
    </div>
  );
}
