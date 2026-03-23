import React, { useEffect, useMemo, useRef } from "react";

function getFocusableElements(container) {
  if (!container) return [];
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");
  return Array.from(container.querySelectorAll(selector)).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

/**
 * PUBLIC_INTERFACE
 * Modal
 *
 * Accessible modal dialog with:
 * - role="dialog", aria-modal="true"
 * - focus moves into dialog on open
 * - focus trap
 * - Escape closes
 * - focus returns to previously focused element on close
 */
export default function Modal({ isOpen, title, onClose, children }) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const titleId = useMemo(() => {
    return `modal_title_${Math.random().toString(16).slice(2)}`;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement;

    const dialogEl = dialogRef.current;
    const focusables = getFocusableElements(dialogEl);
    const toFocus = focusables[0] || dialogEl;
    window.setTimeout(() => toFocus && toFocus.focus(), 0);

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key !== "Tab") return;

      const elements = getFocusableElements(dialogEl);
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === dialogEl) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    const prev = previouslyFocusedRef.current;
    if (prev && typeof prev.focus === "function") {
      prev.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onMouseDown={(e) => {
        // Click-outside closes (but only if the overlay itself was clicked)
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="modalDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modalHeader">
          <h2 className="modalTitle" id={titleId}>
            {title}
          </h2>
          <button className="iconBtn" onClick={onClose} aria-label="Close editor">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
