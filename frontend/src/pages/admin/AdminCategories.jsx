import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTag, HiOutlineTrash } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { categoryService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { applyServerErrors } from '../../utils/validation';
import PageHeader from '../../components/admin/PageHeader';
import SmartImage from '../../components/ui/SmartImage';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import ImageUpload from '../../components/ui/ImageUpload';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { CardGridSkeleton } from '../../components/ui/Skeleton';

const CategoryForm = ({ category, isOpen, onClose, onSaved }) => {
  const [image, setImage] = useState(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (!isOpen) return;
    setImage(null);
    reset({ name: category?.name || '', description: category?.description || '', isActive: String(category?.isActive ?? true) });
  }, [isOpen, category, reset]);

  const onSubmit = async (values) => {
    const payload = { ...values, isActive: values.isActive === 'true' };
    try {
      const { message } = category ? await categoryService.update(category.id, payload, image) : await categoryService.create(payload, image);
      toast.success(message);
      onSaved();
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to save the category'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Edit category' : 'Add category'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <ImageUpload label="Category image" currentUrl={category?.image} onChange={setImage} />
        <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })} />
        <Textarea label="Description" rows={3} maxLength={500} {...register('description')} />
        <div>
          <label className="label" htmlFor="category-status">Status</label>
          <select id="category-status" className="input" {...register('isActive')}>
            <option value="true">Active</option>
            <option value="false">Inactive (hidden from customers)</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>{category ? 'Save Changes' : 'Add Category'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/** Category management: the groups that services are organised into. */
const AdminCategories = () => {
  const { data, loading, refetch } = useFetch(() => categoryService.getAll());
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const [deleting, setDeleting] = useState(null);
  const [working, setWorking] = useState(false);
  const categories = data?.data || [];

  const confirmDelete = async () => {
    setWorking(true);
    try {
      await categoryService.remove(deleting.id);
      toast.success('Category deleted');
      setDeleting(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the category'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Group services so customers can find them quickly.">
        <Button size="sm" onClick={() => setEditing(null)}><HiOutlinePlus className="w-4 h-4" /> Add Category</Button>
      </PageHeader>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : categories.length === 0 ? (
        <div className="card"><EmptyState icon={HiOutlineTag} title="No categories yet" action={<Button size="sm" onClick={() => setEditing(null)}>Add a category</Button>} /></div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col">
              <SmartImage src={category.image} alt="" className="h-36" icon={HiOutlineTag} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 font-sans">{category.name}</h2>
                  <span className={category.isActive ? 'badge-green' : 'badge-gray'}>{category.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 flex-1">{category.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{category.serviceCount} service{category.serviceCount === 1 ? '' : 's'}</span>
                  <div className="flex gap-0.5">
                    <button type="button" className="icon-btn" title="Edit" aria-label={`Edit ${category.name}`} onClick={() => setEditing(category)}><HiOutlinePencil className="w-5 h-5" /></button>
                    <button type="button" className="icon-btn text-red-500" title="Delete" aria-label={`Delete ${category.name}`} onClick={() => setDeleting(category)}><HiOutlineTrash className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <CategoryForm isOpen={editing !== undefined} category={editing || null} onClose={() => setEditing(undefined)} onSaved={refetch} />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={working}
        title="Delete this category?"
        confirmLabel="Delete"
        message={deleting?.serviceCount ? `"${deleting.name}" still has ${deleting.serviceCount} service(s). Move or delete them first.` : `"${deleting?.name}" will be permanently removed.`}
      />
    </div>
  );
};

export default AdminCategories;
