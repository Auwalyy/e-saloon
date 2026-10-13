import { Link, Outlet, useLocation } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineReceiptTax } from 'react-icons/hi';
import { useSettings } from '../context/SettingsContext';
import { PageTransition } from '../components/ui/Motion';
import Logo from '../components/common/Logo';
import ApiStatusBanner from '../components/common/ApiStatusBanner';

const PERKS = [
  { icon: HiOutlineCalendar, text: 'Book any service in under a minute' },
  { icon: HiOutlineClock, text: 'Reschedule or cancel whenever plans change' },
  { icon: HiOutlineReceiptTax, text: 'Receipts and booking history in one place' },
];

/** Split-screen shell for login, registration and password recovery. */
const AuthLayout = () => {
  const { settings } = useSettings();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside className="hidden lg:flex relative flex-col justify-between p-12 text-white bg-salon-dark overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=70"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-salon-dark via-salon-dark/70 to-salon-dark/40" />
        <div className="relative"><Logo light /></div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">{settings.tagline}</h2>
          <ul className="mt-8 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <span className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/60">&copy; {new Date().getFullYear()} {settings.businessName}</p>
      </aside>

      <main className="flex flex-col bg-white">
        <ApiStatusBanner />
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <PageTransition key={pathname}>
            <Outlet />
          </PageTransition>
          <p className="mt-8 text-center text-sm text-gray-500">
            <Link to="/" className="hover:text-gold-700">&larr; Back to website</Link>
          </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
