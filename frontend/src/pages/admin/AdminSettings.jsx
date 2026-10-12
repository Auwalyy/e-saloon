import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineTrash } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { contactService, settingsService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { DAYS, formatDateTime } from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import ImageUpload from '../../components/ui/ImageUpload';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const TABS = [
  { value: 'business', label: 'Salon Information' },
  { value: 'hours', label: 'Opening Hours' },
  { value: 'social', label: 'Social Links' },
  { value: 'booking', label: 'Booking Rules' },
  { value: 'messages', label: 'Messages' },
];

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/2348000000000' },
];

/* ------------------------------ Contact messages ----------------------------- */

const Messages = () => {
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch(() => contactService.getAll({ page, limit: 8 }), [page]);
  const messages = data?.data || [];

  const markRead = async (message) => {
    if (message.isRead) return;
    await contactService.markRead(message.id).catch(() => {});
    refetch();
  };

  const remove = async (message) => {
    try {
      await contactService.remove(message.id);
      toast.success('Message deleted');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the message'));
    }
  };

  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (messages.length === 0) return <div className="card"><EmptyState icon={HiOutlineMail} title="No messages yet" message="Messages sent from the Contact page will appear here." /></div>;

  return (
    <>
      <ul className="space-y-3">
        {messages.map((message) => (
          <li key={message.id} className={`card !p-5 ${message.isRead ? '' : 'border-l-4 border-gold-500'}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{message.subject || 'No subject'}</p>
                <p className="text-sm text-gray-500">
                  {message.name} · <a href={`mailto:${message.email}`} className="text-gold-700 hover:underline">{message.email}</a>
                  {message.phone && <> · {message.phone}</>}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(message.createdAt)}</span>
            </div>
            <p className="text-gray-700 mt-3 whitespace-pre-line">{message.message}</p>
            <div className="flex justify-end gap-2 mt-4">
              {!message.isRead && <Button size="sm" variant="outline" onClick={() => markRead(message)}>Mark as read</Button>}
              <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || 'Your message'}`)}`} className="btn-outline !text-sm" onClick={() => markRead(message)}>Reply by email</a>
              <button type="button" className="icon-btn text-red-500" aria-label="Delete message" title="Delete" onClick={() => remove(message)}><HiOutlineTrash className="w-5 h-5" /></button>
            </div>
          </li>
        ))}
      </ul>
      <Pagination pagination={data.pagination} onPageChange={setPage} />
    </>
  );
};

/* ----------------------------------- Page ----------------------------------- */

/** Salon settings: business details and logo, opening hours, social links and booking rules. */
const AdminSettings = () => {
  const { settings, setSettings, loading } = useSettings();
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const tab = TABS.some((item) => item.value === params.get('tab')) ? params.get('tab') : 'business';

  // Copy the loaded settings into editable form state (once they arrive).
  useEffect(() => {
    if (loading || form) return;
    setForm({
      businessName: settings.businessName, tagline: settings.tagline, about: settings.about,
      address: settings.address, email: settings.email, phone: settings.phone,
      openingHours: settings.openingHours.map((hours) => ({ ...hours })),
      socialLinks: { ...settings.socialLinks },
      slotIntervalMinutes: settings.slotIntervalMinutes,
      cancellationWindowHours: settings.cancellationWindowHours,
    });
  }, [loading, settings, form]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateHours = (day, changes) => update('openingHours', form.openingHours.map((hours) => (hours.day === day ? { ...hours, ...changes } : hours)));
  const updateSocial = (key, value) => update('socialLinks', { ...form.socialLinks, [key]: value });

  const save = async (event) => {
    event.preventDefault();
    if (form.businessName.trim().length < 2) return toast.error('Please enter the business name');
    const invalidDay = form.openingHours.find((hours) => hours.isOpen && hours.open >= hours.close);
    if (invalidDay) return toast.error(`${DAYS[invalidDay.day]}: closing time must be after opening time`);

    setSaving(true);
    try {
      const { data } = await settingsService.update({
        ...form,
        slotIntervalMinutes: Number(form.slotIntervalMinutes),
        cancellationWindowHours: Number(form.cancellationWindowHours),
      }, logo);
      setSettings((current) => ({ ...current, ...data }));
      setLogo(null);
      toast.success('Settings saved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="These details appear across the website, emails, invoices and receipts." />

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6" role="tablist">
        {TABS.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={tab === item.value} onClick={() => setParams({ tab: item.value }, { replace: true })} className={`tab ${tab === item.value ? 'tab-active' : 'bg-white shadow-sm'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'messages' ? <Messages /> : !form ? <Skeleton className="h-96" /> : (
        <form onSubmit={save} className="card max-w-3xl space-y-5" noValidate>
          {tab === 'business' && (
            <>
              <ImageUpload label="Logo" shape="square" currentUrl={settings.logo} onChange={setLogo} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Business name" value={form.businessName} maxLength={120} onChange={(event) => update('businessName', event.target.value)} required />
                <Input label="Tagline" value={form.tagline} maxLength={200} onChange={(event) => update('tagline', event.target.value)} />
                <Input label="Email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
                <Input label="Phone" type="tel" value={form.phone} maxLength={30} onChange={(event) => update('phone', event.target.value)} />
              </div>
              <Input label="Address" value={form.address} maxLength={250} onChange={(event) => update('address', event.target.value)} />
              <Textarea label="About the salon" rows={4} maxLength={2000} value={form.about} onChange={(event) => update('about', event.target.value)} />
            </>
          )}

          {tab === 'hours' && (
            <>
              <p className="text-sm text-gray-500">
                Customers can only book inside these hours. Each stylist's own working hours are set on the Employees page.
              </p>
              <div className="space-y-3">
                {form.openingHours.map((hours) => (
                  <div key={hours.day} className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 w-36 text-sm font-medium text-gray-700">
                      <input type="checkbox" className="w-4 h-4 accent-gold-500" checked={hours.isOpen} onChange={(event) => updateHours(hours.day, { isOpen: event.target.checked })} />
                      {DAYS[hours.day]}
                    </label>
                    {hours.isOpen ? (
                      <>
                        <input type="time" step={900} className="input !w-36 !py-2" value={hours.open} onChange={(event) => updateHours(hours.day, { open: event.target.value })} aria-label={`${DAYS[hours.day]} opening time`} />
                        <span className="text-sm text-gray-400">to</span>
                        <input type="time" step={900} className="input !w-36 !py-2" value={hours.close} onChange={(event) => updateHours(hours.day, { close: event.target.value })} aria-label={`${DAYS[hours.day]} closing time`} />
                      </>
                    ) : <span className="text-sm text-red-500 font-medium">Closed</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'social' && (
            <>
              <p className="text-sm text-gray-500">Links appear in the website footer. Leave a field empty to hide that icon.</p>
              {SOCIALS.map(({ key, label, placeholder }) => (
                <Input key={key} label={label} type="url" placeholder={placeholder} maxLength={200} value={form.socialLinks[key] || ''} onChange={(event) => updateSocial(key, event.target.value)} />
              ))}
            </>
          )}

          {tab === 'booking' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="slot-interval">Time slot interval</label>
                <select id="slot-interval" className="input" value={form.slotIntervalMinutes} onChange={(event) => update('slotIntervalMinutes', event.target.value)}>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">How often a bookable start time is offered.</p>
              </div>
              <div>
                <Input label="Cancellation window (hours)" type="number" min={0} max={72} value={form.cancellationWindowHours} onChange={(event) => update('cancellationWindowHours', event.target.value)} />
                <p className="text-xs text-gray-500 mt-1.5">Customers can cancel or reschedule online up to this many hours before their appointment.</p>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <Button type="submit" loading={saving} className="mt-4">Save Settings</Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;
