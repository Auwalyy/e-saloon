import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { HiLocationMarker, HiPhone, HiMail, HiClock } from 'react-icons/hi';

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-serif font-bold text-xl text-white">Aisha's Salon</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            Lagos's premier luxury salon experience. We bring beauty, confidence, and elegance to every client.
          </p>
          <div className="flex gap-3 mt-5">
            {[FaFacebook, FaInstagram, FaTwitter, FaWhatsapp].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-gray-800 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[['/', 'Home'], ['/about', 'About Us'], ['/services', 'Services'], ['/stylists', 'Our Stylists'], ['/gallery', 'Gallery'], ['/book', 'Book Appointment']].map(([to, label]) => (
              <li key={to}><Link to={to} className="hover:text-gold-400 transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-white font-semibold mb-4">Our Services</h4>
          <ul className="space-y-2 text-sm">
            {['Hair Styling', 'Braiding', 'Facials', 'Spa & Massage', 'Makeup', 'Pedicure & Nails'].map(s => (
              <li key={s}><Link to="/services" className="hover:text-gold-400 transition-colors">{s}</Link></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><HiLocationMarker className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" /><span>15 Victoria Island, Lagos, Nigeria</span></li>
            <li className="flex items-center gap-2"><HiPhone className="w-4 h-4 text-gold-500 shrink-0" /><a href="tel:+2348012345678" className="hover:text-gold-400">+234 801 234 5678</a></li>
            <li className="flex items-center gap-2"><HiMail className="w-4 h-4 text-gold-500 shrink-0" /><a href="mailto:info@aishasalon.com" className="hover:text-gold-400">info@aishasalon.com</a></li>
            <li className="flex items-start gap-2"><HiClock className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" /><span>Mon–Sat: 9:00 AM – 7:00 PM<br />Sunday: Closed</span></li>
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
      <p>© {new Date().getFullYear()} Aisha's Salon. All rights reserved. Built with ❤️ in Lagos.</p>
    </div>
  </footer>
);

export default Footer;
