"use client";

import { useTranslations } from "next-intl";

/**
 * EPFL-styled modal dialog.
 *
 * Visual: rounded-xl card, red left accent on the title,
 * clickable backdrop to dismiss. Uses DaisyUI dialog primitives.
 *
 * @param {{ open: boolean, title?: string, onClose: () => void, children: React.ReactNode }} props
 */
export default function Modal({ open, title, children, onClose }) {
  const t = useTranslations("modal");

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      {/* Backdrop — click outside to close */}
      <div className="modal-backdrop bg-black/40" onClick={onClose} />

      <div className="modal-box rounded-xl shadow-xl border border-base-300 max-w-lg w-full relative z-10">
        {title && (
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-base-200">
            <div className="w-1 h-6 rounded-full bg-primary shrink-0" />
            <h3 className="font-semibold text-lg text-base-content">{title}</h3>
          </div>
        )}

        <div className="modal-content">{children}</div>

        <div className="modal-action mt-5 pt-4 border-t border-base-200">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
