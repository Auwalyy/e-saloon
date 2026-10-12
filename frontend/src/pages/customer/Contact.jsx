import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import { contactService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { DAYS, formatTime } from '../../utils/helpers';
import { rules, applyServerErrors } from '../../utils/validation';
import PageHero from '../../components/common/PageHero';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';

/** Contact page: salon details, opening hours, a map and a message form. */
const Contact = () => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' },
  });

  const onSubmit = async (values) => {
    try {
      const { message } = await contactService.send(values);
      toast.success(message);
      reset({ name: values.name, email: values.email, phone: values.phone, subject: '', message: '' });
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to send your message'));
    }
  };

  const details = [
    { icon: HiOutlineLocationMarker, label: 'Address', value: settings.address },
    { icon: HiOutlinePhone, label: 'Phone', value: settings.phone, href: settings.phone && `tel:${settings.phone.replace(/\s/g, '')}` },
    { icon: HiOutlineMail, label: 'Email', value: settings.email, href: settings.email && `mailto:${settings.email}` },
  ].filter((item) => item.value);

  return (
    <>
      <PageHero eyebrow="Get in touch" title="Contact Us" subtitle="Questions, feedback or a special request? We would love to hear from you." />

      <section className="container-page py-12 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-5">
            {details.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex gap-4">
                <span className="w-11 h-11 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">{label}</p>
                  {href
                    ? <a href={href} className="text-gray-800 font-medium hover:text-gold-700 break-words">{value}</a>
                    : <p className="text-gray-800 font-medium">{value}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 font-sans mb-3">
              <HiOutlineClock className="w-5 h-5 text-gold-600" /> Opening Hours
            </h2>
            <ul className="space-y-2 text-sm">
              {settings.openingHours.map((hours) => (
                <li key={hours.day} className="flex justify-between">
                  <span className="text-gray-600">{DAYS[hours.day]}</span>
                  <span className={hours.isOpen ? 'text-gray-900 font-medium' : 'text-red-500 font-medium'}>
                    {hours.isOpen ? `${formatTime(hours.open)} - ${formatTime(hours.close)}` : 'Closed'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4" noValidate>
            <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Name" autoComplete="name" error={errors.name?.message} {...register('name', rules.name)} />
              <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email', rules.email)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Phone (optional)" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone', rules.optionalPhone)} />
              <Input label="Subject (optional)" maxLength={150} error={errors.subject?.message} {...register('subject')} />
            </div>
            <Textarea
              label="Message"
              rows={5}
              placeholder="How can we help?"
              error={errors.message?.message}
              {...register('message', {
                required: 'Please enter your message',
                minLength: { value: 10, message: 'Message must be at least 10 characters' },
                maxLength: { value: 2000, message: 'Message is too long' },
              })}
            />
            <Button type="submit" loading={isSubmitting}>Send Message</Button>
          </form>

          {settings.address && (
            <div className="rounded-2xl overflow-hidden shadow-card bg-white">
              <iframe
                title="Salon location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
                className="w-full h-72 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Contact;
