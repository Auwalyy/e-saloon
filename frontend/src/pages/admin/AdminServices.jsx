import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineScissors, HiOutlineTrash } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { categoryService, serviceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { cleanParams, formatCurrency, formatDuration } from '../../utils/helpers';
import { applyServerErrors } from '../../utils/validation';
import PageHeader from '../../components/admin/PageHeader';
import SmartImage from '../../components/ui/SmartImage';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import ImageUpload from '../../components/ui/ImageUpload';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const DURATIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360];

const ServiceForm = ({ service, isOpen, onClose, onSaved, categories }) => {
  const [image, setImage] = useState(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (!isOpen) return;
    setImage(null);
    reset({
      name: service?.name || '',
      description: service?.description || '',
      category: service?.category?.id || '',
      price: service?.price ?? '',
      duration: service?.duration || 60,
      isActive: String(service?.isActive ?? true),
      isFeatured: service?.isFeatured || false,
    });
  }, [isOpen, service, reset]);

  const onSubmit = async (values) => {
    const payload = { ...values, price: Number(values.price), duration: Number(values.duration), isActive: values.isActive === 'true' };
    try {
      const { message } = service ? await serviceService.update(service.id, payload, image) : await serviceService.create(payload, image);
      toast.success(message);
      onSaved();
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to save the service'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? 'Edit service' : 'Add service'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <ImageUpload label="Service image" currentUrl={service?.image} onChange={setImage} />
        <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })} />
        <Textarea label="Description" rows={3} maxLength={1000} error={errors.description?.message} {...register('description')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="service-category">Category</label>
            <select id="service-category" className="input" {...register('category')}>
              <option value="">Uncategorised</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <Input
            label="Price (₦)"
            type="number"
            min={0}
            step="50"
            error={errors.price?.message}
            {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price cannot be negative' } })}
          />
          <div>
            <label className="label" htmlFor="service-duration">Duration</label>
            <select id="service-duration" className="input" {...register('duration')}>
              {DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="service-status">Status</label>
            <select id="service-status" className="input" {...register('isActive')}>
              <option value="true">Active (visible to customers)</option>
              <option value="false">Inactive (hidden)</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="w-4 h-4 accent-gold-500" {...register('isFeatured')} />
          Feature this service on the home page
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>{service ? 'Save Changes' : 'Add Service'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/** Service management: create, edit, delete, with search and filters. */
const AdminServices = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const [deleting, setDeleting] = useState(null);
  const [working, setWorking] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, loading, refetch } = useFetch(
    () => serviceService.getAll(cleanParams({ search: debouncedSearch, category, status, page, limit: 10, sort: 'name' })),
    [debouncedSearch, category, status, page]
  );
  const categories = useFetch(() => categoryService.getAll());
  const categoryList = categories.data?.data || [];
  const services = data?.data || [];

  useEffect(() => { setPage(1); }, [debouncedSearch, category, status]);

  const confirmDelete = async () => {
    setWorking(true);
    try {
      const { message } = await serviceService.remove(deleting.id);
      toast.success(message);
      setDeleting(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the service'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader title="Services" subtitle="Everything customers can book.">
        <Button size="sm" onClick={() => setEditing(null)}><HiOutlinePlus className="w-4 h-4" /> Add Service</Button>
      </PageHeader>

      <div className="card !p-4 mb-4 grid gap-3 md:grid-cols-[1fr_200px_180px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search services..." />
        <select className="input" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categoryList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton cols={6} rows={8} />
      ) : services.length === 0 ? (
        <div className="card"><EmptyState icon={HiOutlineScissors} title="No services found" action={<Button size="sm" onClick={() => setEditing(null)}>Add a service</Button>} /></div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Service</th><th>Category</th><th>Price</th><th>Duration</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <SmartImage src={service.image} alt="" className="w-12 h-12 rounded-xl shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {service.name}
                            {service.isFeatured && <span className="badge-gold">Featured</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>{service.category?.name || <span className="text-gray-400">Uncategorised</span>}</td>
                    <td className="font-medium">{formatCurrency(service.price)}</td>
                    <td>{formatDuration(service.duration)}</td>
                    <td><span className={service.isActive ? 'badge-green' : 'badge-gray'}>{service.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <button type="button" className="icon-btn" title="Edit" aria-label="Edit" onClick={() => setEditing(service)}><HiOutlinePencil className="w-5 h-5" /></button>
                        <button type="button" className="icon-btn text-red-500" title="Delete" aria-label="Delete" onClick={() => setDeleting(service)}><HiOutlineTrash className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}

      <ServiceForm isOpen={editing !== undefined} service={editing || null} onClose={() => setEditing(undefined)} onSaved={refetch} categories={categoryList} />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={working}
        title="Delete this service?"
        confirmLabel="Delete"
        message={`"${deleting?.name}" will be removed. Services that have been booked before are deactivated instead, so past records stay intact.`}
      />
    </div>
  );
};

export default AdminServices;
