import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatTime } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import DateSlotPicker from './DateSlotPicker';

/**
 * Moves an appointment to another date / time. Admins may also pass a list of
 * `stylists` to reassign the appointment to a different stylist.
 */
const RescheduleModal = ({ appointment, onClose, onDone, stylists }) => {
  const [slot, setSlot] = useState({ date: '', time: '' });
  const [employeeId, setEmployeeId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appointment) return;
    setSlot({ date: appointment.date, time: '' });
    setEmployeeId(appointment.employee?.id || '');
  }, [appointment]);

  const changeStylist = (id) => {
    setEmployeeId(id);
    setSlot({ date: slot.date, time: '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      await appointmentService.reschedule(appointment.id, { date: slot.date, startTime: slot.time, employeeId });
      toast.success('Appointment rescheduled');
      onDone?.();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to reschedule'));
      if (error.response?.status === 409) setSlot({ date: slot.date, time: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(appointment)} onClose={onClose} title="Reschedule appointment" size="lg">
      {appointment && (
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{appointment.service?.name}</span> is currently booked for{' '}
            <span className="font-medium text-gray-900">{formatDate(appointment.date, 'EEE, d MMM yyyy')} at {formatTime(appointment.startTime)}</span>{' '}
            with {appointment.employee?.name}.
          </p>

          {stylists?.length > 0 && (
            <div>
              <label className="label" htmlFor="reschedule-stylist">Stylist</label>
              <select id="reschedule-stylist" className="input" value={employeeId} onChange={(event) => changeStylist(event.target.value)}>
                {stylists.map((stylist) => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
              </select>
            </div>
          )}

          <DateSlotPicker
            serviceId={appointment.service?.id}
            employeeId={employeeId}
            value={slot}
            onChange={setSlot}
            excludeAppointmentId={appointment.id}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Close</Button>
            <Button size="sm" onClick={save} loading={saving} disabled={!slot.date || !slot.time}>
              {slot.time ? `Move to ${formatTime(slot.time)}` : 'Choose a time'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RescheduleModal;
