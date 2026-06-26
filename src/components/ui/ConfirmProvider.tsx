import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmContext, type ConfirmOptions } from './confirmContext';

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
      {options && (
        <div className="modal-overlay" role="presentation">
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            <h2 id="confirm-title">{options.title}</h2>
            <p id="confirm-message">{options.message}</p>
            <div className="confirm-actions">
              <button type="button" className="button secondary" onClick={() => handleClose(false)}>
                {options.cancelLabel ?? 'Cancelar'}
              </button>
              <button type="button" className="button danger" onClick={() => handleClose(true)}>
                {options.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
