import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/index';
import { Spinner } from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    settingsService.get().then(({ data }) => reset(data.data)).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (k !== 'logo') fd.append(k, v || ''); });
      if (data.logo?.[0]) fd.append('logo', data.logo[0]);
      await settingsService.update(fd);
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage salon information and configuration</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Salon Information</h2>
          <Input label="Salon Name" {...register('salon_name')} />
          <Input label="Email" type="email" {...register('salon_email')} />
          <Input label="Phone" {...register('salon_phone')} />
          <div>
            <label className="label">Address</label>
            <textarea className="input resize-none" rows={2} {...register('salon_address')} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} {...register('salon_description')} />
          </div>
          <div>
            <label className="label">Logo</label>
            <input type="file" accept="image/*" className="input py-2" {...register('logo')} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card space-y-4">
          <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Business Hours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Opening Time</label>
              <input type="time" className="input" {...register('opening_time')} />
            </div>
            <div>
              <label className="label">Closing Time</label>
              <input type="time" className="input" {...register('closing_time')} />
            </div>
          </div>
          <Input label="Slot Duration (minutes)" type="number" {...register('slot_duration')} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card space-y-4">
          <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Currency</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency Code" placeholder="NGN" {...register('currency')} />
            <Input label="Currency Symbol" placeholder="₦" {...register('currency_symbol')} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card space-y-4">
          <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Social Media</h2>
          <Input label="Facebook URL" {...register('facebook')} />
          <Input label="Instagram URL" {...register('instagram')} />
          <Input label="Twitter URL" {...register('twitter')} />
        </motion.div>

        <Button type="submit" loading={saving} className="w-full">Save All Settings</Button>
      </form>
    </div>
  );
};

export default AdminSettings;
