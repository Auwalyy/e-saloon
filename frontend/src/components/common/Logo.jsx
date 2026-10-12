import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { mediaUrl } from '../../services/api';

/** Salon logo (uploaded image, or a gold monogram) with the business name. */
const Logo = ({ to = '/', light = false, subtitle }) => {
  const { settings } = useSettings();

  return (
    <Link to={to} className="flex items-center gap-2.5 min-w-0">
      {settings.logo ? (
        <img src={mediaUrl(settings.logo)} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
      ) : (
        <span className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center text-salon-dark font-serif font-bold shrink-0">
          {settings.businessName.charAt(0)}
        </span>
      )}
      <span className="min-w-0">
        <span className={`block font-serif font-bold text-lg leading-tight truncate ${light ? 'text-white' : 'text-gray-900'}`}>
          {settings.businessName}
        </span>
        {subtitle && <span className="block text-xs text-gray-400 leading-tight">{subtitle}</span>}
      </span>
    </Link>
  );
};

export default Logo;
