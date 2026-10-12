import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineBriefcase } from 'react-icons/hi';
import SmartImage from '../ui/SmartImage';
import StarRating from '../ui/StarRating';
import { DAYS, getInitials } from '../../utils/helpers';

/** Stylist tile: photo, specialisation, experience, working days, rating and Book button. */
const StylistCard = ({ stylist, compact = false }) => {
  const workingDays = stylist.workingHours.filter((hours) => hours.isWorking).map((hours) => hours.day);

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden flex flex-col h-full"
    >
      <SmartImage src={stylist.photo} alt={stylist.name} className="h-64" imgClassName="object-top" monogram={getInitials(stylist.name)} />
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{stylist.name}</h3>
        <p className="text-sm text-gold-700 font-medium">{stylist.specialization}</p>

        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={stylist.rating.average} />
          <span className="text-xs text-gray-500">
            {stylist.rating.count ? `${stylist.rating.average.toFixed(1)} (${stylist.rating.count})` : 'New'}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-3">
          <HiOutlineBriefcase className="w-4 h-4" /> {stylist.experienceYears} years' experience
        </p>

        {!compact && (
          <>
            {stylist.bio && <p className="text-sm text-gray-500 mt-3 line-clamp-3">{stylist.bio}</p>}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Working days</p>
              <div className="flex gap-1">
                {DAYS.map((day, index) => (
                  <span
                    key={day}
                    title={`${day}: ${workingDays.includes(index) ? 'available' : 'off'}`}
                    className={`w-8 h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center ${
                      workingDays.includes(index) ? 'bg-gold-100 text-gold-800' : 'bg-gray-100 text-gray-300 line-through'
                    }`}
                  >
                    {day.slice(0, 2)}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex-1" />
        <Link to={`/book?stylist=${stylist.id}`} className="btn-secondary w-full mt-5 !py-2.5 !text-sm">
          Book Appointment
        </Link>
      </div>
    </motion.article>
  );
};

export default StylistCard;
