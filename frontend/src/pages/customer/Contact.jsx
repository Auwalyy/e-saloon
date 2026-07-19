import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { HiLocationMarker, HiPhone, HiMail, HiClock } from 'react-icons/hi';
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Contact = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    reset();
  };

  const info = [
    { icon: HiLocationMarker, label: 'Address', value: '15 Victoria Island, Lagos, Nigeria' },
    { icon: HiPhone, label: 'Phone', value: '+234 801 234 5678' },
    { icon: HiMail, label: 'Email', value: 'info@aishasalon.com' },
    { icon: HiClock, label: 'Hours', value: 'Mon–Sat: 9AM – 7PM' },
  ];

  return (
    <div className="min-h-screen bg-salon-bg">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Contact Us</h1>
            <p className="text-gray-300 text-lg">We'd love to hear from you</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Get In Touch</h2>
            <div className="space-y-5 mb-8">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-gray-700 font-medium mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {[FaFacebook, FaInstagram, FaTwitter, FaWhatsapp].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-gray-100 hover:bg-gold-500 hover:text-white rounded-xl flex items-center justify-center transition-colors text-gray-600">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" placeholder="Amaka" error={errors.firstName?.message}
                  {...register('firstName', { required: 'Required' })} />
                <Input label="Last Name" placeholder="Johnson" error={errors.lastName?.message}
                  {...register('lastName', { required: 'Required' })} />
              </div>
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message}
                {...register('email', { required: 'Required' })} />
              <Input label="Subject" placeholder="How can we help?" error={errors.subject?.message}
                {...register('subject', { required: 'Required' })} />
              <div>
                <label className="label">Message</label>
                <textarea className={`input resize-none ${errors.message ? 'border-red-400' : ''}`} rows={5}
                  placeholder="Your message..."
                  {...register('message', { required: 'Message is required' })} />
                {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
              </div>
              <Button type="submit" loading={isSubmitting} className="w-full">Send Message</Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
