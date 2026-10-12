import { useState } from 'react';
import { HiOutlineSparkles } from 'react-icons/hi';
import { mediaUrl } from '../../services/api';

/**
 * Image with a shimmer while loading and a branded placeholder when the
 * source is missing or fails to load, so cards never show a broken image.
 * Pass `monogram` (initials) to show a monogram tile instead of the icon.
 */
const SmartImage = ({ src, alt = '', className = '', imgClassName = '', icon: Icon = HiOutlineSparkles, monogram }) => {
  const [status, setStatus] = useState(src ? 'loading' : 'error');

  return (
    <div className={`relative overflow-hidden bg-gold-50 ${className}`}>
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
      {status === 'error' && monogram ? (
        // People without a photo get an elegant initials tile instead of an empty box.
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-salon-dark via-neutral-800 to-neutral-700">
          <span className="w-24 h-24 rounded-full border border-gold-500/60 flex items-center justify-center font-serif text-4xl text-gold-400 tracking-wide" aria-hidden="true">
            {monogram}
          </span>
        </div>
      ) : status === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold-100 to-gold-200">
          <Icon className="w-10 h-10 text-gold-500" aria-hidden="true" />
        </div>
      ) : (
        <img
          src={mediaUrl(src)}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
    </div>
  );
};

export default SmartImage;
