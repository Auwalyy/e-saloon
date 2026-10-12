import { Link } from 'react-router-dom';
import { HiOutlineEye, HiOutlineHeart, HiOutlineLightBulb } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { employeeService, serviceService, reviewService } from '../../services';
import { useSettings } from '../../context/SettingsContext';
import PageHero, { SectionHeading } from '../../components/common/PageHero';
import SmartImage from '../../components/ui/SmartImage';
import { Reveal } from '../../components/ui/Motion';

const STORY_IMAGE = 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=1000&q=70';

const VALUES = [
  { icon: HiOutlineLightBulb, title: 'Our Mission', text: 'To make every client look and feel their best through skilled, honest and attentive service.' },
  { icon: HiOutlineEye, title: 'Our Vision', text: 'To be the most trusted salon in the city, where booking is effortless and quality is never in doubt.' },
  { icon: HiOutlineHeart, title: 'Our Values', text: 'Care for people, pride in our craft, respect for your time and a spotless, welcoming space.' },
];

/** About page: the salon's story, live numbers and guiding values. */
const About = () => {
  const { settings } = useSettings();
  const stylists = useFetch(() => employeeService.getAll({ limit: 1 }));
  const services = useFetch(() => serviceService.getAll({ limit: 1 }));
  const reviews = useFetch(() => reviewService.getAll({ limit: 1 }));

  // Real figures from the system rather than made-up marketing numbers.
  const stats = [
    { label: 'Services offered', value: services.data?.pagination?.total },
    { label: 'Professional stylists', value: stylists.data?.pagination?.total },
    { label: 'Verified reviews', value: reviews.data?.summary?.count },
    { label: 'Average rating', value: reviews.data?.summary?.count ? `${reviews.data.summary.average.toFixed(1)} / 5` : undefined },
  ];

  return (
    <>
      <PageHero eyebrow="About us" title={`About ${settings.businessName}`} subtitle={settings.tagline} />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-2 items-center">
          <Reveal>
            <SmartImage src={STORY_IMAGE} alt="The salon team" className="rounded-3xl shadow-card aspect-[4/3]" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow mb-3">Our story</p>
            <h2 className="section-title">Beauty, care and convenience under one roof</h2>
            <p className="text-gray-600 mt-5 leading-relaxed">
              {settings.about || `${settings.businessName} is a full-service salon offering hair, braiding, skincare, spa, makeup and nail services.`}
            </p>
            <p className="text-gray-600 mt-4 leading-relaxed">
              We built this online platform so you never have to call around or wait in line again. See what is available,
              choose your stylist, and book the time that works for you. Your appointments, payments and receipts stay in
              one place.
            </p>
            <Link to="/book" className="btn-primary mt-8">Book an Appointment</Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-salon-dark text-white">
        <div className="container-page py-14 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map(({ label, value }) => (
            <div key={label}>
              <p className="text-4xl font-serif font-bold text-gold-400">{value ?? '-'}</p>
              <p className="mt-2 text-sm text-gray-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="What guides us" title="Mission, Vision and Values" />
          <div className="grid gap-6 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.05}>
                <div className="card h-full text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-gray-900">{title}</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
