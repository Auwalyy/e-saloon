import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiCalendar } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { employeeService, serviceService } from '../../services/index';
import { getInitials } from '../../utils/helpers';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StarRating from '../../components/ui/StarRating';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [availModal, setAvailModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [availability, setAvailability] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = () => {
    setLoading(true);
    employeeService.getAll({ search }).then(({ data }) => setEmployees(data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { serviceService.getAll({ limit: 100 }).then(({ data }) => setServices(data.data || [])); }, []);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (emp) => {
    setEditing(emp);
    reset({ name: emp.name, email: emp.email, phone: emp.phone, specialization: emp.specialization, experience_years: emp.experience_years, bio: emp.bio });
    setModalOpen(true);
  };

  const openAvail = async (emp) => {
    const { data } = await employeeService.getOne(emp.id);
    const avail = data.data?.availability || [];
    setAvailability(DAYS.map((_, i) => {
      const found = avail.find(a => a.day_of_week === i);
      return { day_of_week: i, start_time: found?.start_time?.slice(0, 5) || '09:00', end_time: found?.end_time?.slice(0, 5) || '18:00', is_available: found?.is_available ?? (i !== 0) };
    }));
    setAvailModal(emp);
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      await employeeService.updateAvailability(availModal.id, { availability });
      toast.success('Availability updated!');
      setAvailModal(null);
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null && k !== 'avatar') fd.append(k, v); });
      if (data.avatar?.[0]) fd.append('avatar', data.avatar[0]);
      if (editing) await employeeService.update(editing.id, fd);
      else await employeeService.create(fd);
      toast.success(editing ? 'Employee updated!' : 'Employee added!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeeService.delete(deleteTarget.id);
      toast.success('Employee deactivated');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your salon team</p>
        </div>
        <Button onClick={openCreate}><HiPlus className="w-4 h-4" /> Add Employee</Button>
      </div>

      <div className="card">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input pl-10" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp, i) => (
            <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card hover:shadow-card-hover transition-shadow text-center"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-4 ring-gold-100">
                {emp.avatar ? <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full bg-gold-500 flex items-center justify-center text-white font-bold text-xl">{getInitials(emp.name)}</div>}
              </div>
              <h3 className="font-semibold text-gray-900">{emp.name}</h3>
              <p className="text-gold-600 text-xs mt-1">{emp.specialization}</p>
              <p className="text-gray-400 text-xs">{emp.experience_years} yrs exp</p>
              <div className="flex justify-center mt-1">
                <StarRating rating={parseFloat(emp.avg_rating)} size="sm" />
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                <button onClick={() => openEdit(emp)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit">
                  <HiPencil className="w-4 h-4" />
                </button>
                <button onClick={() => openAvail(emp)} className="p-2 hover:bg-gold-50 rounded-lg text-gold-600 transition-colors" title="Availability">
                  <HiCalendar className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(emp)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Required' })} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Required' })} />
            <Input label="Phone" error={errors.phone?.message} {...register('phone', { required: 'Required' })} />
            <Input label="Specialization" error={errors.specialization?.message} {...register('specialization', { required: 'Required' })} />
            <Input label="Experience (years)" type="number" {...register('experience_years')} />
            {!editing && <Input label="Password" type="password" placeholder="Default: Employee@123" {...register('password')} />}
            <div className="col-span-2">
              <label className="label">Profile Photo</label>
              <input type="file" accept="image/*" className="input py-2" {...register('avatar')} />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={3} {...register('bio')} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Add'} Employee</Button>
          </div>
        </form>
      </Modal>

      {/* Availability Modal */}
      <Modal isOpen={!!availModal} onClose={() => setAvailModal(null)} title={`${availModal?.name} — Availability`} size="lg">
        <div className="space-y-3">
          {availability.map((slot, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input type="checkbox" checked={slot.is_available}
                onChange={e => setAvailability(prev => prev.map((s, j) => j === i ? { ...s, is_available: e.target.checked } : s))}
                className="rounded border-gray-300 text-gold-500" />
              <span className="w-10 text-sm font-medium text-gray-700">{DAYS[i]}</span>
              <input type="time" value={slot.start_time} disabled={!slot.is_available}
                onChange={e => setAvailability(prev => prev.map((s, j) => j === i ? { ...s, start_time: e.target.value } : s))}
                className="input py-1.5 text-sm w-32 disabled:opacity-50" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="time" value={slot.end_time} disabled={!slot.is_available}
                onChange={e => setAvailability(prev => prev.map((s, j) => j === i ? { ...s, end_time: e.target.value } : s))}
                className="input py-1.5 text-sm w-32 disabled:opacity-50" />
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setAvailModal(null)}>Cancel</Button>
            <Button onClick={saveAvailability} loading={saving}>Save Availability</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Deactivate Employee" message={`Deactivate ${deleteTarget?.name}?`} />
    </div>
  );
};

export default AdminEmployees;
