import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { categoryService } from '../../services/index';
import { Spinner } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = () => {
    setLoading(true);
    categoryService.getAll().then(({ data }) => setCategories(data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (cat) => { setEditing(cat); reset({ name: cat.name, description: cat.description }); setModalOpen(true); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && k !== 'image') fd.append(k, v); });
      if (data.image?.[0]) fd.append('image', data.image[0]);
      if (editing) await categoryService.update(editing.id, fd);
      else await categoryService.create(fd);
      toast.success(editing ? 'Category updated!' : 'Category created!');
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await categoryService.delete(deleteTarget.id);
      toast.success('Category deactivated');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage service categories</p>
        </div>
        <Button onClick={openCreate}><HiPlus className="w-4 h-4" /> Add Category</Button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card hover:shadow-card-hover transition-shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center text-gold-600 font-bold text-lg">
                    {cat.name?.[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-400">{cat.service_count} services</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                  <HiPencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(cat)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Category Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} {...register('description')} />
          </div>
          <div>
            <label className="label">Image</label>
            <input type="file" accept="image/*" className="input py-2" {...register('image')} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Deactivate Category" message={`Deactivate "${deleteTarget?.name}"?`} />
    </div>
  );
};

export default AdminCategories;
