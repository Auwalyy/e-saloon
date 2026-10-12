import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineBadgeCheck, HiOutlineCalendar, HiOutlineChevronDown, HiOutlineClock, HiOutlineHeart,
  HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineStar,
} from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { serviceService, employeeService, reviewService, galleryService, categoryService } from '../../services';
import { useSettings } from '../../context/SettingsContext';
import { DAYS, formatTime } from '../../utils/helpers';
import { SectionHeading } from '../../components/common/PageHero';
import ServiceCard from '../../components/common/ServiceCard';
import StylistCard from '../../components/common/StylistCard';
import ReviewCard from '../../components/common/ReviewCard';
import SmartImage from '../../components/ui/SmartImage';
import StarRating from '../../components/ui/StarRating';
import { CardGridSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/ui/Motion';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=70';
const HERO_PHOTOS = {
  main: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=75',
  detail: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=700&q=75',
};

const FEATURES = [
  { icon: HiOutlineBadgeCheck, title: 'Expert stylists', text: 'Experienced professionals who keep training in the latest techniques.' },
  { icon: HiOutlineSparkles, title: 'Premium products', text: 'Trusted, salon-grade brands that are kind to your hair and skin.' },
  { icon: HiOutlineCalendar, title: 'Easy online booking', text: 'Pick your service, stylist and time in under a minute, any time of day.' },
  { icon: HiOutlineShieldCheck, title: 'Clean and safe', text: 'Tools are sanitised after every client and stations are cleaned between visits.' },
  { icon: HiOutlineClock, title: 'We respect your time', text: 'Real-time availability means no double bookings and no long waits.' },
  { icon: HiOutlineHeart, title: 'Personal care', text: 'Every treatment starts with a conversation about what you want.' },
];

const buildFaqs = (settings) => [
  {
    question: 'How do I book an appointment?',
    answer: 'Click "Book Now", choose a service, pick your stylist, then select a date and an available time. You will receive a confirmation email straight away.',
  },
  {
    question: 'Can I cancel or reschedule my appointment?',
    answer: `Yes. Open "My Bookings" and choose Reschedule or Cancel up to ${settings.cancellationWindowHours} hour(s) before your appointment. After that, please call us.`,
  },
  {
    question: 'How do I pay?',
    answer: 'You can pay at the salon by cash, POS or bank transfer. When online payment is switched on you can also pay by card while booking. A receipt is issued for every payment.',
  },
  {
    question: 'Do I need an account to book?',
    answer: 'You can browse everything without one, but a free account is needed to confirm a booking so you can manage it and download your receipts later.',
  },
  {
    question: 'What if I am running late?',
    answer: 'Please call us as soon as you can. We hold appointments for 15 minutes; after that we may need to shorten or reschedule the service.',
  },
];

const FaqItem = ({ faq, isOpen, onToggle }) => (
  <div className="bg-white rounded-2xl shadow-card overflow-hidden">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left">
      <span className="font-semibold text-gray-900">{faq.question}</span>
      <HiOutlineChevronDown className={`w-5 h-5 text-gold-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <p className="px-6 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/** Landing page: hero, popular services, stylists, benefits, reviews, gallery, hours, FAQs and a closing call to action. */
const Home = () => {
  const { settings } = useSettings();
  const [openFaq, setOpenFaq] = useState(0);

  const services = useFetch(() => serviceService.getPopular(6));
  const stylists = useFetch(() => employeeService.getAll({ limit: 4 }));
  const reviews = useFetch(() => reviewService.getAll({ limit: 3, sort: 'top' }));
  const gallery = useFetch(() => galleryService.getAll({ limit: 8 }));
  const categories = useFetch(() => categoryService.getAll());

  const summary = reviews.data?.summary;
  const today = new Date().getDay();
  const todayHours = settings.openingHours.find((hours) => hours.day === today);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-salon-dark text-white overflow-hidden">
        {/* Photo backdrop on small screens; a soft gold glow on large ones where the photos sit beside the text. */}
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 lg:hidden" />
        <div className="absolute inset-0 bg-gradient-to-b from-salon-dark/60 via-salon-dark/80 to-salon-dark lg:hidden" />
        <div className="hidden lg:block absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full bg-gold-500/20 blur-3xl" aria-hidden="true" />
        <div className="hidden lg:block absolute -bottom-52 -left-40 w-[520px] h-[520px] rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />

        <div className="container-page relative grid lg:grid-cols-2 gap-12 items-center pt-20 pb-28 lg:pt-24 lg:pb-36">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400" /> Welcome to {settings.businessName}
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.1]">
              {settings.tagline.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-gold-400 italic">{settings.tagline.split(' ').slice(-1)}</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-xl leading-relaxed">
              Hair, braids, skincare, spa, makeup and nails by stylists who love what they do. Book your appointment online in
              under a minute.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/book" className="btn-primary !px-8 !py-4 !text-base">Book Appointment</Link>
              <Link to="/services" className="inline-flex items-center justify-center border border-white/40 hover:border-white hover:bg-white hover:text-salon-dark font-semibold px-8 py-4 rounded-xl transition-colors">
                Explore Services
              </Link>
            </div>
            {summary?.count > 0 && (
              <div className="mt-10 flex items-center gap-3 text-sm text-gray-300">
                <StarRating rating={summary.average} size="md" />
                <span><strong className="text-white">{summary.average.toFixed(1)}</strong> from {summary.count} verified reviews</span>
              </div>
            )}
          </motion.div>

          {/* Photo composition */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative hidden lg:block h-[480px]">
            <div className="absolute right-0 top-0 w-[68%] h-[400px] rounded-[2rem] overflow-hidden ring-1 ring-white/10 shadow-2xl">
              <img src={HERO_PHOTOS.main} alt="A stylist blow-drying a client's hair" className="w-full h-full object-cover" />
            </div>
            <div className="absolute left-0 bottom-0 w-[46%] h-[280px] rounded-[2rem] overflow-hidden ring-4 ring-salon-dark shadow-2xl">
              <img src={HERO_PHOTOS.detail} alt="Makeup being applied" className="w-full h-full object-cover" />
            </div>
            {todayHours && (
              <div className="absolute right-4 -bottom-2 bg-white text-salon-dark rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center"><HiOutlineClock className="w-5 h-5" /></span>
                <span>
                  <span className="block text-xs text-gray-500">Today</span>
                  <span className="block text-sm font-semibold">
                    {todayHours.isOpen ? `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}` : 'Closed today'}
                  </span>
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Trust strip: live figures, overlapping the hero */}
      <section className="container-page relative -mt-14 z-10">
        <dl className="bg-white rounded-2xl shadow-card grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 overflow-hidden">
          {[
            { icon: HiOutlineStar, label: 'Average rating', value: summary?.count ? `${summary.average.toFixed(1)} / 5` : null },
            { icon: HiOutlineHeart, label: 'Verified reviews', value: summary?.count },
            { icon: HiOutlineBadgeCheck, label: 'Professional stylists', value: stylists.data?.pagination?.total },
            { icon: HiOutlineSparkles, label: 'Service categories', value: categories.data?.data?.length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-5">
              <span className="w-11 h-11 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
              <div>
                <dd className="text-2xl font-bold text-salon-dark leading-none">{value ?? <Skeleton className="h-6 w-12" />}</dd>
                <dt className="text-xs text-gray-500 mt-1.5">{label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Popular services */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Our services" title="Popular Services" subtitle="The treatments our clients book again and again." />
          {services.loading ? (
            <CardGridSkeleton count={6} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(services.data?.data || []).map((service, index) => (
                <Reveal key={service.id} delay={index * 0.05}><ServiceCard service={service} /></Reveal>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/services" className="btn-secondary">View All Services</Link>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="section bg-white">
        <div className="container-page">
          <SectionHeading eyebrow="Why choose us" title="The Aisha's Salon Difference" subtitle="Little details that make every visit feel special." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.05}>
                <div className="p-6 rounded-2xl bg-salon-bg h-full hover:shadow-card transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gold-500 text-salon-dark flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-gray-600 text-sm leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured stylists */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Our team" title="Featured Stylists" subtitle="Meet the talented people behind every great look." />
          {stylists.loading ? (
            <CardGridSkeleton count={4} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(stylists.data?.data || []).map((stylist, index) => (
                <Reveal key={stylist.id} delay={index * 0.05}><StylistCard stylist={stylist} compact /></Reveal>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/stylists" className="btn-secondary">Meet the Whole Team</Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section bg-white">
        <div className="container-page">
          <SectionHeading eyebrow="Testimonials" title="What Our Customers Say" subtitle="Real reviews from clients after their appointments." />
          {reviews.loading ? (
            <div className="grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52" />)}</div>
          ) : (reviews.data?.data || []).length === 0 ? (
            <p className="text-center text-gray-500">Reviews will appear here once customers share their experience.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.data.data.map((review, index) => (
                <Reveal key={review.id} delay={index * 0.05}><ReviewCard review={review} /></Reveal>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/reviews" className="btn-secondary">Read More Reviews</Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Gallery" title="A Look Inside Our Work" subtitle="A few recent favourites from the salon floor." />
          {gallery.loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(gallery.data?.data || []).map((item, index) => (
                <Reveal key={item.id} delay={index * 0.03}>
                  <Link to="/gallery" className="group block relative rounded-2xl overflow-hidden shadow-card">
                    <SmartImage src={item.image} alt={item.title || item.category} className="aspect-square" imgClassName="group-hover:scale-110 !transition-all !duration-500" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-medium px-3 pt-8 pb-3">
                      {item.title || item.category}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/gallery" className="btn-secondary">View Full Gallery</Link>
          </div>
        </div>
      </section>

      {/* Working hours */}
      <section className="section bg-white">
        <div className="container-page grid gap-10 lg:grid-cols-2 items-center">
          <Reveal>
            <p className="eyebrow mb-3">Visit us</p>
            <h2 className="section-title">Working Hours</h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Walk-ins are welcome, but booking ahead guarantees your preferred stylist and time.
              {settings.address && <> You will find us at <span className="font-medium text-gray-800">{settings.address}</span>.</>}
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/book" className="btn-primary">Book a Visit</Link>
              <Link to="/contact" className="btn-outline !px-6 !py-3">Get Directions</Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="card divide-y divide-gray-100 !p-2">
              {settings.openingHours.map((hours) => (
                <li key={hours.day} className={`flex items-center justify-between px-4 py-3 rounded-xl ${hours.day === today ? 'bg-gold-50' : ''}`}>
                  <span className="font-medium text-gray-800 flex items-center gap-2">
                    {DAYS[hours.day]}
                    {hours.day === today && <span className="badge-gold">Today</span>}
                  </span>
                  <span className={hours.isOpen ? 'text-gray-600' : 'text-red-500 font-medium'}>
                    {hours.isOpen ? `${formatTime(hours.open)} - ${formatTime(hours.close)}` : 'Closed'}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* FAQs */}
      <section className="section">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow="FAQs" title="Frequently Asked Questions" />
          <div className="space-y-3">
            {buildFaqs(settings).map((faq, index) => (
              <FaqItem key={faq.question} faq={faq} isOpen={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? -1 : index)} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="gold-gradient text-salon-dark">
        <div className="container-page py-16 text-center">
          <HiOutlineStar className="w-10 h-10 mx-auto opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mt-4">Ready for your next great look?</h2>
          <p className="mt-3 text-salon-dark/80 max-w-xl mx-auto">Choose a time that suits you and we will take care of the rest.</p>
          <Link to="/book" className="inline-flex mt-8 bg-salon-dark text-white hover:bg-black font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg">
            Book Your Appointment
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
