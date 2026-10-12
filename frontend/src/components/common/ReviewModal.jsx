import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reviewService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import StarRating from '../ui/StarRating';
import Textarea from '../ui/Textarea';

/** Lets a customer rate and review a completed appointment. */
const ReviewModal = ({ appointment, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRating(0);
    setComment('');
  }, [appointment?.id]);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) return toast.error('Please choose a star rating');
    setSaving(true);
    try {
      const { message } = await reviewService.create({ appointmentId: appointment.id, rating, comment });
      toast.success(message);
      onSubmitted?.();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to submit your review'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(appointment)} onClose={onClose} title="Leave a review">
      {appointment && (
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm text-gray-600">
            How was your <span className="font-medium text-gray-900">{appointment.service?.name}</span> with{' '}
            <span className="font-medium text-gray-900">{appointment.employee?.name}</span> on {formatDate(appointment.date)}?
          </p>
          <div>
            <span className="label">Your rating</span>
            <StarRating rating={rating} size="lg" onChange={setRating} />
          </div>
          <Textarea
            label="Your comments (optional)"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            placeholder="Tell us about your experience..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" loading={saving}>Submit Review</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReviewModal;
