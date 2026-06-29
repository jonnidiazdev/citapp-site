import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ConfirmContext, type ConfirmOptions } from './confirmContext';
import { useDialogA11y } from '../../hooks/useDialogA11y';

function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions;
  onClose: (result: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useDialogA11y({
    isOpen: true,
    containerRef: dialogRef,
    onClose: () => onClose(false),
    initialFocusRef: cancelRef,
  });

  return (
    <div className="modal-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        tabIndex={-1}
      >
        <h2 id="confirm-title">{options.title}</h2>
        <p id="confirm-message">{options.message}</p>
        <div className="confirm-actions">
          <button
            ref={cancelRef}
            type="button"
            className="button secondary"
            onClick={() => onClose(false)}
          >
            {options.cancelLabel ?? 'Cancelar'}
          </button>
          <button type="button" className="button danger" onClick={() => onClose(true)}>
            {options.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = (result: boolean) => {
    resolver?.(result);
    setOptions(null);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && <ConfirmDialog options={options} onClose={handleClose} />}
    </ConfirmContext.Provider>
  );
}
