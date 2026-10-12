import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineClock } from 'react-icons/hi';
import SmartImage from '../ui/SmartImage';
import { formatCurrency, formatDuration } from '../../utils/helpers';

/** Service tile: image, name, description, duration, price and a Book button. */
const ServiceCard = ({ service }) => (
  <motion.article
    whileHover={{ y: -6 }}
    transition={{ duration: 0.2 }}
    className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden flex flex-col h-full"
  >
    <div className="relative">
      <SmartImage src={service.image} alt={service.name} className="h-48" imgClassName="group-hover:scale-105 !transition-all !duration-500" />
      {service.category && (
        <span className="absolute top-3 left-3 badge bg-white/95 text-gold-800 shadow-sm">{service.category.name}</span>
      )}
    </div>
    <div className="p-5 flex flex-col flex-1">
      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 flex-1">{service.description}</p>
      <div className="flex items-center justify-between mt-4">
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <HiOutlineClock className="w-4 h-4" /> {formatDuration(service.duration)}
        </span>
        <span className="text-lg font-bold text-gold-700">{formatCurrency(service.price)}</span>
      </div>
      <Link to={`/book?service=${service.id}`} className="btn-primary w-full mt-4 !py-2.5 !text-sm">
        Book Now
      </Link>
    </div>
  </motion.article>
);

export default ServiceCard;
