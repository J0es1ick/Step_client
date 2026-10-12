import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
export default function Modal({
  children,
  title,
  onClose,
  drawer = false,
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  drawer?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      aria-label={title}
      className={`modal ${drawer ? "drawer" : ""} ${wide ? "modal-wide" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const r = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="icon-button modal-close"
        aria-label="Закрыть"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      {children}
    </dialog>,
    document.body,
  );
}
