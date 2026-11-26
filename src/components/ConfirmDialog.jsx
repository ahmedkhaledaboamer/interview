import { useEffect, useId, useRef } from 'react';
import Icon from './Icon.jsx';
import { btn } from './buttonStyles.js';

/** Accessible in-page confirmation built on the native <dialog> element. */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-3xl border border-line bg-card p-0 text-fg shadow-2xl"
    >
      <div className="p-6 sm:p-7">
        <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent-text">
          <Icon name="alert" />
        </div>
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        <p id={bodyId} className="mt-2 text-muted">
          {body}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" autoFocus onClick={onCancel} className={btn('ghost')}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={btn(tone)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
