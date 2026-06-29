import { useId, useRef, type ReactNode } from 'react';
import { FiX } from 'react-icons/fi';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  disabled?: boolean;
}

export function Modal({ isOpen, title, onClose, children, footer, disabled = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDialogA11y({
    isOpen,
    containerRef: dialogRef,
    onClose,
    closeOnEscape: !disabled,
    enabled: !disabled,
  });

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!disabled) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={disabled}
            aria-label="Cerrar"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
