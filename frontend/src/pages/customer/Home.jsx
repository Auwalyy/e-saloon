import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar, HiArrowRight, HiCheckCircle, HiClock, HiPhone } from 'react-icons/hi';
import { FaScissors, FaSpa, FaPaintBrush } from 'react-icons/fa';
import { serviceService, reviewService, employeeService } from '../../services/index';
import { formatCurrency, formatDate } from '../../utils/helpers';
import StarRating from '../../components/ui/StarRating';
import { CardSkeleton } from '../../components/ui/Skeleton';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const Home = () => {
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    Promise.all([
      serviceService.getAll({ featured: 'true', limit: 6 }),
      employeeService.getAll(),
      reviewService.getAll({ approved: 'true', limit: 6 }),
    ]).then(([s, e, r]) => {
      setServices(s.data.data || []);
      setStylists(e.data.data?.slice(0, 4) || []);
      setReviews(r.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const faqs = [
    { q: 'How do I book an appointment?', a: 'Click "Book Now", choose your service, stylist, date and time. It takes less than 2 minutes!' },
    { q: 'Can I cancel or reschedule?', a: 'Yes! You can cancel or reschedule up to 24 hours before your appointment from your profile.' },
    { q: 'What payment methods do you accept?', a: 'We accept Paystack, Flutterwave, card payments, and cash on arrival.' },
    { q: 'Do I need to create an account?', a: 'Yes, a free account is required to book appointments and track your history.' },
    { q: 'How long do services take?', a: 'Duration varies by service. Each service listing shows the estimated duration.' },
  ];

  const whyUs = [
    { icon: HiCheckCircle, title: 'Expert Stylists', desc: 'Certified professionals with years of experience' },
    { icon: HiStar, title: 'Premium Products', desc: 'We use only top-quality, skin-safe products' },
    { icon: HiClock, title: 'Flexible Hours', desc: 'Open Monday to Saturday, 9AM to 7PM' },
    { icon: HiPhone, title: '24/7 Booking', desc: 'Book anytime online, no phone calls needed' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <span className="inline-block bg-gold-500/20 text-gold-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-gold-500/30">
              ✨ Lagos's Premier Luxury Salon
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
              Beauty That <span className="text-gradient">Speaks</span> For Itself
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Experience world-class hair, beauty, and wellness services at Aisha's Salon. Book your appointment online in seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/book" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                Book Appointment <HiArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/services" className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl transition-all duration-200">
                View Services
              </Link>
            </div>
            <div className="flex items-center gap-8 mt-12">
              {[['500+', 'Happy Clients'], ['50+', 'Services'], ['4', 'Expert Stylists']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-3xl font-bold text-gold-400">{num}</p>
                  <p className="text-gray-400 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
            <div className="w-1 h-3 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-gold-600 font-medium text-sm uppercase tracking-widest">What We Offer</span>
            <h2 className="section-title mt-2">Popular Services</h2>
            <p className="section-subtitle">From hair to spa, we have everything you need to look and feel amazing</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />) :
              services.map((svc, i) => (
                <motion.div key={svc.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="card hover:shadow-card-hover transition-all duration-300 group overflow-hidden p-0"
                >
                  <div className="h-48 bg-gradient-to-br from-gold-100 to-gold-200 overflow-hidden">
                    {svc.image ? (
                      <img src={svc.image} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaScissors className="w-12 h-12 text-gold-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="text-xs text-gold-600 font-medium bg-gold-50 px-2 py-0.5 rounded-full">{svc.category_name}</span>
                    <h3 className="font-semibold text-gray-900 mt-2 mb-1">{svc.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{svc.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gold-600 font-bold text-lg">{formatCurrency(svc.price)}</p>
                        <p className="text-gray-400 text-xs">{svc.duration} mins</p>
                      </div>
                      <Link to={`/book?service=${svc.id}`} className="btn-primary text-sm py-2 px-4">Book</Link>
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </div>
          <div className="text-center mt-10">
            <Link to="/services" className="btn-secondary">View All Services <HiArrowRight className="inline w-4 h-4 ml-1" /></Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-salon-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-gold-600 font-medium text-sm uppercase tracking-widest">Why Us</span>
            <h2 className="section-title mt-2">Why Choose Aisha's Salon</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card text-center hover:shadow-card-hover transition-shadow"
              >
                <div className="w-14 h-14 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-gold-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stylists */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-gold-600 font-medium text-sm uppercase tracking-widest">Our Team</span>
            <h2 className="section-title mt-2">Meet Our Stylists</h2>
            <p className="section-subtitle">Talented professionals dedicated to making you look your best</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stylists.map((stylist, i) => (
              <motion.div key={stylist.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card text-center hover:shadow-card-hover transition-shadow group"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-gold-100">
                  {stylist.avatar ? (
                    <img src={stylist.avatar} alt={stylist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gold-500 flex items-center justify-center text-white text-2xl font-bold">
                      {stylist.name?.[0]}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{stylist.name}</h3>
                <p className="text-gold-600 text-sm mt-1">{stylist.specialization}</p>
                <p className="text-gray-400 text-xs mt-1">{stylist.experience_years} years experience</p>
                <StarRating rating={parseFloat(stylist.avg_rating)} className="justify-center mt-2" />
                <Link to={`/book?employee=${stylist.id}`} className="btn-primary w-full mt-4 text-sm py-2">Book Now</Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/stylists" className="btn-secondary">Meet All Stylists</Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-gold-400 font-medium text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-2">What Our Clients Say</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <StarRating rating={review.rating} />
                <p className="text-gray-300 text-sm mt-3 leading-relaxed">"{review.comment}"</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {review.customer_name?.[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{review.customer_name}</p>
                    <p className="text-gray-400 text-xs">{formatDate(review.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Working Hours */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="section-title">Working Hours</h2>
          </motion.div>
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['Monday', '9:00 AM – 7:00 PM'], ['Tuesday', '9:00 AM – 7:00 PM'], ['Wednesday', '9:00 AM – 7:00 PM'], ['Thursday', '9:00 AM – 7:00 PM'], ['Friday', '9:00 AM – 7:00 PM'], ['Saturday', '9:00 AM – 6:00 PM'], ['Sunday', 'Closed']].map(([day, hours]) => (
                <div key={day} className={`flex justify-between items-center p-3 rounded-xl ${day === 'Sunday' ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <span className="font-medium text-gray-700">{day}</span>
                  <span className={`text-sm font-medium ${day === 'Sunday' ? 'text-red-500' : 'text-gold-600'}`}>{hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-salon-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="card cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{faq.q}</h4>
                  <span className="text-gold-500 text-xl font-bold">{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && <p className="text-gray-500 text-sm mt-3 leading-relaxed">{faq.a}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gold-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl font-serif font-bold text-white mb-4">Ready to Look Amazing?</h2>
            <p className="text-white/80 text-lg mb-8">Book your appointment today and experience the Aisha's Salon difference.</p>
            <Link to="/book" className="bg-white text-gold-600 font-bold px-10 py-4 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-lg">
              Book Now <HiArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
