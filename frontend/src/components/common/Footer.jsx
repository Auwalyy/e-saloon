import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { HiOutlineLocationMarker, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import { useSettings } from '../../context/SettingsContext';
import { DAYS, formatTime } from '../../utils/helpers';
import Logo from './Logo';

const SOCIAL_ICONS = { facebook: FaFacebookF, instagram: FaInstagram, twitter: FaXTwitter, tiktok: FaTiktok, whatsapp: FaWhatsapp };

const QUICK_LINKS = [
  { to: '/services', label: 'Services' },
  { to: '/stylists', label: 'Our Stylists' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/book', label: 'Book Appointment' },
];

/** Site footer: about, quick links, contact details, hours and social links. */
const Footer = () => {
  const { settings } = useSettings();
  const socials = Object.entries(settings.socialLinks || {}).filter(([key, url]) => url && SOCIAL_ICONS[key]);

  return (
    <footer className="bg-salon-dark text-gray-300">
      <div className="container-page py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm text-gray-400 leading-relaxed">{settings.tagline}</p>
          {socials.length > 0 && (
            <div className="flex gap-2 mt-5">
              {socials.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold-500 flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="font-semibold text-white mb-4">Quick Links</p>
          <ul className="space-y-2 text-sm">
            {QUICK_LINKS.map(({ to, label }) => (
              <li key={to}><Link to={to} className="hover:text-gold-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white mb-4">Contact</p>
          <ul className="space-y-3 text-sm">
            {settings.address && (
              <li className="flex gap-2"><HiOutlineLocationMarker className="w-5 h-5 text-gold-500 shrink-0" />{settings.address}</li>
            )}
            {settings.phone && (
              <li className="flex gap-2">
                <HiOutlinePhone className="w-5 h-5 text-gold-500 shrink-0" />
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-gold-400">{settings.phone}</a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-2">
                <HiOutlineMail className="w-5 h-5 text-gold-500 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-gold-400 break-all">{settings.email}</a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white mb-4">Opening Hours</p>
          <ul className="space-y-1.5 text-sm">
            {settings.openingHours.map((hours) => (
              <li key={hours.day} className="flex justify-between gap-4">
                <span>{DAYS[hours.day]}</span>
                <span className={hours.isOpen ? 'text-gray-400' : 'text-red-400'}>
                  {hours.isOpen ? `${formatTime(hours.open)} - ${formatTime(hours.close)}` : 'Closed'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          <p>E-Salon Platform for Online Booking and Business Management</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
