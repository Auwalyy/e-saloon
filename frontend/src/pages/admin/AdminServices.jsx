import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiPencil, HiTrash, HiSearch } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { serviceService, categoryService } from '../../services/index';
import { formatCurrency } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const load = () => {
    setLoading(true);
    serviceService.getAll({ page, limit: 12, search })
      .then(({ data }) => { setServices(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search]);
  useEffect(() => { categoryService.getAll().then(({ data }) => setCategories(data.data || [])); }, []);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (svc) => {
    setEditing(svc);
    reset({ name: svc.name, description: svc.description, category_id: svc.category_id, price: svc.price, duration: svc.duration, is_featured: svc.is_featured });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null && k !== 'image') fd.append(k, v); });
      if (data.image?.[0]) fd.append('image', data.image[0]);
      if (editing) await serviceService.update(editing.id, fd);
      else await serviceService.create(fd);
      toast.success(editing ? 'Service updated!' : 'Service created!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await serviceService.delete(deleteTarget.id);
      toast.success('Service deactivated');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 text-sm mt-1">Manage salon services</p>
        </div>
        <Button onClick={openCreate}><HiPlus className="w-4 h-4" /> Add Service</Button>
      </div>

      <div className="card">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input pl-10" placeholder="Search services..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? <TableSkeleton rows={8} cols={6} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No services found</td></tr>
              ) : services.map((svc, i) => (
                <motion.tr key={svc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      {svc.image && <img src={svc.image} alt={svc.name} className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className="font-medium text-gray-900">{svc.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{svc.description}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gold">{svc.category_name}</span></td>
                  <td className="font-semibold text-gold-600">{formatCurrency(svc.price)}</td>
                  <td className="text-sm text-gray-600">{svc.duration} min</td>
                  <td>
                    <span className={`badge ${svc.is_active ? 'badge-green' : 'badge-red'}`}>
                      {svc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(svc)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(svc)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="p-4"><Pagination {...pagination} onPageChange={setPage} /></div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add Service'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Service Name" error={errors.name?.message}
                {...register('name', { required: 'Name is required' })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className={`input ${errors.category_id ? 'border-red-400' : ''}`}
                {...register('category_id', { required: 'Category is required' })}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
            </div>
            <Input label="Price (₦)" type="number" step="0.01" error={errors.price?.message}
              {...register('price', { required: 'Price is required', min: { value: 0, message: 'Must be positive' } })} />
            <Input label="Duration (minutes)" type="number" error={errors.duration?.message}
              {...register('duration', { required: 'Duration is required', min: { value: 1, message: 'Min 1 minute' } })} />
            <div>
              <label className="label">Service Image</label>
              <input type="file" accept="image/*" className="input py-2" {...register('image')} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} {...register('description')} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" {...register('is_featured')} className="rounded border-gray-300 text-gold-500" />
            <label htmlFor="featured" className="text-sm text-gray-700">Featured service</label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Create'} Service</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate Service"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default AdminServices;
