import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { galleryService } from '../../services/index';
import { Spinner } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const CATEGORIES = ['hair', 'braids', 'facials', 'spa', 'makeup', 'pedicure', 'other'];

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const load = () => {
    setLoading(true);
    galleryService.getAll({ category: activeCategory !== 'all' ? activeCategory : undefined })
      .then(({ data }) => setImages(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [activeCategory]);

  const onSubmit = async (data) => {
    if (!data.image?.[0]) return toast.error('Please select an image');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('image', data.image[0]);
      fd.append('title', data.title || '');
      fd.append('category', data.category);
      fd.append('is_featured', data.is_featured ? 'true' : 'false');
      await galleryService.add(fd);
      toast.success('Image uploaded!');
      setModalOpen(false);
      reset();
      load();
    } catch { toast.error('Upload failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await galleryService.delete(deleteTarget.id);
      toast.success('Image deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-500 text-sm mt-1">{images.length} images</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><HiPlus className="w-4 h-4" /> Upload Image</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${activeCategory === cat ? 'bg-gold-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gold-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((img, i) => (
            <motion.div key={img.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              className="relative group rounded-xl overflow-hidden aspect-square shadow-card"
            >
              <img src={img.image_url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <button onClick={() => setDeleteTarget(img)}
                  className="opacity-0 group-hover:opacity-100 p-2 bg-red-500 text-white rounded-full transition-opacity">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-white text-xs capitalize">{img.category}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Image" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Image *</label>
            <input type="file" accept="image/*" className="input py-2" {...register('image')} />
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="Optional title" {...register('title')} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" {...register('category', { required: true })}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" {...register('is_featured')} className="rounded border-gray-300 text-gold-500" />
            <label htmlFor="featured" className="text-sm text-gray-700">Featured image</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Upload</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Delete Image" message="Are you sure you want to delete this image?" />
    </div>
  );
};

export default AdminGallery;
