import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlinePencil, HiOutlinePhotograph, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { galleryService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { cleanParams } from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import SmartImage from '../../components/ui/SmartImage';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUpload from '../../components/ui/ImageUpload';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const CATEGORIES = ['Hair', 'Braids', 'Facials', 'Spa', 'Makeup', 'Pedicure'];

const GalleryForm = ({ item, isOpen, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(item?.title || '');
    setCategory(item?.category || CATEGORIES[0]);
    setImage(null);
  }, [isOpen, item]);

  const submit = async (event) => {
    event.preventDefault();
    if (!item && !image) return toast.error('Please choose an image to upload');
    setSaving(true);
    try {
      const { message } = item
        ? await galleryService.update(item.id, { title, category }, image)
        : await galleryService.create({ title, category }, image);
      toast.success(message);
      onSaved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the image'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit gallery image' : 'Add gallery image'}>
      <form onSubmit={submit} className="space-y-4">
        <ImageUpload label="Image" currentUrl={item?.image} onChange={setImage} />
        <Input label="Caption (optional)" maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Bridal glam" />
        <div>
          <label className="label" htmlFor="gallery-category">Category</label>
          <select id="gallery-category" className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving}>{item ? 'Save Changes' : 'Add Image'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/** Gallery management: upload, categorise, hide and delete the photos shown on the website. */
const AdminGallery = () => {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data, loading, refetch } = useFetch(() => galleryService.getAll(cleanParams({ category, page, limit: 12 })), [category, page]);
  const items = data?.data || [];

  useEffect(() => { setPage(1); }, [category]);

  const toggleVisibility = async (item) => {
    setBusyId(item.id);
    try {
      await galleryService.update(item.id, { isActive: !item.isActive });
      toast.success(item.isActive ? 'Image hidden from the website' : 'Image is visible again');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update the image'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setBusyId(deleting.id);
    try {
      await galleryService.remove(deleting.id);
      toast.success('Image deleted');
      setDeleting(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the image'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Gallery" subtitle="Photos shown on the public gallery page.">
        <Button size="sm" onClick={() => setEditing(null)}><HiOutlinePlus className="w-4 h-4" /> Add Image</Button>
      </PageHeader>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4" role="tablist">
        {['', ...CATEGORIES].map((option) => (
          <button key={option || 'all'} type="button" role="tab" aria-selected={category === option} onClick={() => setCategory(option)} className={`tab ${category === option ? 'tab-active' : 'bg-white shadow-sm'}`}>
            {option || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
      ) : items.length === 0 ? (
        <div className="card"><EmptyState icon={HiOutlinePhotograph} title="No images in this category" action={<Button size="sm" onClick={() => setEditing(null)}>Upload an image</Button>} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <figure key={item.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="relative">
                  <SmartImage src={item.image} alt={item.title || item.category} className={`aspect-square ${item.isActive ? '' : 'opacity-40'}`} />
                  {!item.isActive && <span className="badge-gray absolute top-2 left-2">Hidden</span>}
                </div>
                <figcaption className="p-3">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.title || 'Untitled'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="badge-gold">{item.category}</span>
                    <div className="flex">
                      <button type="button" className="icon-btn !p-1.5" disabled={busyId === item.id} title={item.isActive ? 'Hide' : 'Show'} aria-label={item.isActive ? 'Hide image' : 'Show image'} onClick={() => toggleVisibility(item)}>
                        {item.isActive ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                      </button>
                      <button type="button" className="icon-btn !p-1.5" title="Edit" aria-label="Edit image" onClick={() => setEditing(item)}><HiOutlinePencil className="w-4 h-4" /></button>
                      <button type="button" className="icon-btn !p-1.5 text-red-500" title="Delete" aria-label="Delete image" onClick={() => setDeleting(item)}><HiOutlineTrash className="w-4 h-4" /></button>
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}

      <GalleryForm isOpen={editing !== undefined} item={editing || null} onClose={() => setEditing(undefined)} onSaved={refetch} />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={Boolean(deleting) && busyId === deleting.id}
        title="Delete this image?"
        confirmLabel="Delete"
        message="The image will be permanently removed from the gallery."
      />
    </div>
  );
};

export default AdminGallery;
