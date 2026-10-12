/** Banner shown at the top of inner pages (About, Services, Gallery ...). */
const PageHero = ({ eyebrow, title, subtitle }) => (
  <section className="bg-gradient-to-b from-gold-50 to-salon-bg border-b border-gold-100/60">
    <div className="container-page py-14 md:py-20 text-center">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="text-4xl md:text-5xl font-bold text-salon-dark">{title}</h1>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  </section>
);

/** Centred heading used to introduce a section. */
export const SectionHeading = ({ eyebrow, title, subtitle, className = '' }) => (
  <div className={`text-center mb-12 ${className}`}>
    {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
    <h2 className="section-title">{title}</h2>
    {subtitle && <p className="section-subtitle">{subtitle}</p>}
  </div>
);

export default PageHero;
