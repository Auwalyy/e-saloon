import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { addDays, format, parseISO } from 'date-fns';
import { HiChevronLeft, HiChevronRight, HiOutlineCalendar, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash, HiOutlineUserGroup } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { employeeService, serviceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { cleanParams, DAYS, formatTime, getStatusColor, humanize, toDateString } from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import ImageUpload from '../../components/ui/ImageUpload';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import StarRating from '../../components/ui/StarRating';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton, TableSkeleton } from '../../components/ui/Skeleton';

const defaultHours = () => DAYS.map((_, day) => ({ day, isWorking: day !== 0, start: '09:00', end: '18:00' }));
const emptyForm = () => ({
  name: '', email: '', phone: '', specialization: '', experienceYears: 0, bio: '', services: [], workingHours: defaultHours(), isActive: true,
});

/* ------------------------------- Add / edit form ------------------------------ */

const EmployeeForm = ({ employee, isOpen, onClose, onSaved, services }) => {
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPhoto(null);
    setForm(employee ? {
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      specialization: employee.specialization || '',
      experienceYears: employee.experienceYears || 0,
      bio: employee.bio || '',
      services: employee.services.map((service) => service.id),
      workingHours: employee.workingHours.map((hours) => ({ ...hours })),
      isActive: employee.isActive,
    } : emptyForm());
  }, [isOpen, employee]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateHours = (day, changes) => update('workingHours', form.workingHours.map((hours) => (hours.day === day ? { ...hours, ...changes } : hours)));
  const toggleService = (id) => update('services', form.services.includes(id) ? form.services.filter((item) => item !== id) : [...form.services, id]);

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Please enter the employee\'s name');
    const invalidDay = form.workingHours.find((hours) => hours.isWorking && hours.start >= hours.end);
    if (invalidDay) return toast.error(`${DAYS[invalidDay.day]}: closing time must be after the start time`);

    setSaving(true);
    try {
      const payload = { ...form, experienceYears: Number(form.experienceYears) || 0 };
      const { message } = employee ? await employeeService.update(employee.id, payload, photo) : await employeeService.create(payload, photo);
      toast.success(message);
      onSaved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the employee'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Edit employee' : 'Add employee'} size="lg">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="flex flex-col sm:flex-row gap-5">
          <ImageUpload label="Photo" shape="round" currentUrl={employee?.photo} onChange={setPhoto} />
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            <Input label="Full name" value={form.name} onChange={(event) => update('name', event.target.value)} required maxLength={100} />
            <Input label="Specialisation" value={form.specialization} onChange={(event) => update('specialization', event.target.value)} placeholder="e.g. Braiding Specialist" maxLength={150} />
            <Input label="Email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
            <Input label="Phone" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
            <Input label="Years of experience" type="number" min={0} max={60} value={form.experienceYears} onChange={(event) => update('experienceYears', event.target.value)} />
            <div>
              <label className="label" htmlFor="employee-status">Status</label>
              <select id="employee-status" className="input" value={String(form.isActive)} onChange={(event) => update('isActive', event.target.value === 'true')}>
                <option value="true">Active (bookable)</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <Textarea label="Bio" rows={2} maxLength={1000} value={form.bio} onChange={(event) => update('bio', event.target.value)} />

        <fieldset>
          <legend className="label">Services offered <span className="text-gray-400 font-normal">(leave empty if they perform every service)</span></legend>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {services.map((service) => {
              const selected = form.services.includes(service.id);
              return (
                <button key={service.id} type="button" aria-pressed={selected} onClick={() => toggleService(service.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-gold-500 border-gold-500 text-salon-dark' : 'border-gray-200 text-gray-600 hover:border-gold-400'}`}>
                  {service.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">Working days and hours</legend>
          <div className="space-y-2">
            {form.workingHours.map((hours) => (
              <div key={hours.day} className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 w-32 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={hours.isWorking} onChange={(event) => updateHours(hours.day, { isWorking: event.target.checked })} className="w-4 h-4 accent-gold-500" />
                  {DAYS[hours.day]}
                </label>
                {hours.isWorking ? (
                  <>
                    <input type="time" step={900} className="input !w-32 !py-2" value={hours.start} onChange={(event) => updateHours(hours.day, { start: event.target.value })} aria-label={`${DAYS[hours.day]} start time`} />
                    <span className="text-gray-400 text-sm">to</span>
                    <input type="time" step={900} className="input !w-32 !py-2" value={hours.end} onChange={(event) => updateHours(hours.day, { end: event.target.value })} aria-label={`${DAYS[hours.day]} end time`} />
                  </>
                ) : <span className="text-sm text-gray-400">Day off</span>}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving}>{employee ? 'Save Changes' : 'Add Employee'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/* --------------------------------- Schedule --------------------------------- */

const ScheduleModal = ({ employee, onClose }) => {
  const [from, setFrom] = useState(() => toDateString());
  const { data, loading } = useFetch(
    () => (employee ? employeeService.getSchedule(employee.id, { from, to: toDateString(addDays(parseISO(from), 6)) }) : Promise.resolve(null)),
    [employee?.id, from]
  );

  useEffect(() => { if (employee) setFrom(toDateString()); }, [employee]);

  const schedule = data?.data;
  const days = Array.from({ length: 7 }, (_, index) => addDays(parseISO(from), index));
  const shift = (amount) => setFrom(toDateString(addDays(parseISO(from), amount)));

  return (
    <Modal isOpen={Boolean(employee)} onClose={onClose} title={employee ? `${employee.name}'s schedule` : ''} size="lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" className="icon-btn" onClick={() => shift(-7)} aria-label="Previous week"><HiChevronLeft className="w-5 h-5" /></button>
        <p className="font-medium text-gray-900">{format(days[0], 'd MMM')} - {format(days[6], 'd MMM yyyy')}</p>
        <button type="button" className="icon-btn" onClick={() => shift(7)} aria-label="Next week"><HiChevronRight className="w-5 h-5" /></button>
      </div>

      {loading || !schedule ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <ul className="space-y-3">
          {days.map((day) => {
            const dateString = toDateString(day);
            const hours = schedule.employee.workingHours.find((item) => item.day === day.getDay());
            const appointments = schedule.appointments.filter((appointment) => appointment.date === dateString);
            return (
              <li key={dateString} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{format(day, 'EEEE, d MMM')}</p>
                  <span className="text-xs text-gray-500">
                    {hours?.isWorking ? `${formatTime(hours.start)} - ${formatTime(hours.end)}` : 'Day off'}
                  </span>
                </div>
                {appointments.length === 0 ? (
                  <p className="text-sm text-gray-400 mt-1">{hours?.isWorking ? 'No appointments' : ''}</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {appointments.map((appointment) => (
                      <li key={appointment.id} className="flex items-center justify-between gap-3 text-sm bg-salon-bg rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-900 whitespace-nowrap">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                        <span className="flex-1 truncate text-gray-600">{appointment.service?.name} · {appointment.customer?.name}</span>
                        <span className={getStatusColor(appointment.status)}>{humanize(appointment.status)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};

/* ----------------------------------- Page ----------------------------------- */

/** Employee management: add, edit, delete, photos, working days and hours, schedules. */
const AdminEmployees = () => {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [scheduleFor, setScheduleFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [working, setWorking] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, loading, refetch } = useFetch(() => employeeService.getAll(cleanParams({ search: debouncedSearch, limit: 100 })), [debouncedSearch]);
  const services = useFetch(() => serviceService.getAll({ limit: 100, sort: 'name' }));
  const employees = data?.data || [];

  const confirmDelete = async () => {
    setWorking(true);
    try {
      const { message } = await employeeService.remove(deleting.id);
      toast.success(message);
      setDeleting(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the employee'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader title="Employees" subtitle="Your stylists, their services and working hours.">
        <Button size="sm" onClick={() => setEditing(null)}><HiOutlinePlus className="w-4 h-4" /> Add Employee</Button>
      </PageHeader>

      <div className="card !p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, specialisation, email or phone..." className="max-w-md" />
      </div>

      {loading ? (
        <TableSkeleton cols={6} />
      ) : employees.length === 0 ? (
        <div className="card">
          <EmptyState icon={HiOutlineUserGroup} title="No employees found" action={<Button size="sm" onClick={() => setEditing(null)}>Add your first employee</Button>} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Employee</th><th>Contact</th><th>Experience</th><th>Working days</th><th>Rating</th><th>Status</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={employee.photo} name={employee.name} />
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gold-700">{employee.specialization || 'Stylist'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p>{employee.phone || '-'}</p>
                    <p className="text-xs text-gray-500">{employee.email}</p>
                  </td>
                  <td>{employee.experienceYears} yr{employee.experienceYears === 1 ? '' : 's'}</td>
                  <td>
                    <div className="flex gap-0.5">
                      {employee.workingHours.map((hours) => (
                        <span key={hours.day} title={hours.isWorking ? `${DAYS[hours.day]}: ${formatTime(hours.start)} - ${formatTime(hours.end)}` : `${DAYS[hours.day]}: off`} className={`w-6 h-6 rounded text-[10px] font-semibold flex items-center justify-center ${hours.isWorking ? 'bg-gold-100 text-gold-800' : 'bg-gray-100 text-gray-300'}`}>
                          {DAYS[hours.day][0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={employee.rating.average} />
                      <span className="text-xs text-gray-500">({employee.rating.count})</span>
                    </div>
                  </td>
                  <td><span className={employee.isActive ? 'badge-green' : 'badge-gray'}>{employee.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex justify-end gap-0.5">
                      <button type="button" className="icon-btn text-blue-600" title="View schedule" aria-label="View schedule" onClick={() => setScheduleFor(employee)}><HiOutlineCalendar className="w-5 h-5" /></button>
                      <button type="button" className="icon-btn" title="Edit" aria-label="Edit" onClick={() => setEditing(employee)}><HiOutlinePencil className="w-5 h-5" /></button>
                      <button type="button" className="icon-btn text-red-500" title="Delete" aria-label="Delete" onClick={() => setDeleting(employee)}><HiOutlineTrash className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeForm isOpen={editing !== undefined} employee={editing || null} onClose={() => setEditing(undefined)} onSaved={refetch} services={services.data?.data || []} />
      <ScheduleModal employee={scheduleFor} onClose={() => setScheduleFor(null)} />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={working}
        title="Delete this employee?"
        confirmLabel="Delete"
        message={`${deleting?.name} will be removed. Employees with past appointments are deactivated instead, so history is preserved.`}
      />
    </div>
  );
};

export default AdminEmployees;
