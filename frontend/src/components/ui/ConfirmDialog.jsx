import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-600 mb-6">{message || 'Are you sure you want to proceed?'}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading}>Confirm</Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
