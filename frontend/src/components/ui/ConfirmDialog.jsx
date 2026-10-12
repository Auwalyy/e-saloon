import Modal from './Modal';
import Button from './Button';

/** Yes / no confirmation used before destructive or irreversible actions. */
const ConfirmDialog = ({
  isOpen, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', variant = 'danger', loading, children,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-600 text-sm">{message || 'Are you sure you want to proceed?'}</p>
    {children && <div className="mt-4">{children}</div>}
    <div className="flex gap-3 justify-end mt-6">
      <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
