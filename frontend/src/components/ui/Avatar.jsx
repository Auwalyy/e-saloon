import { useState } from 'react';
import { mediaUrl } from '../../services/api';
import { getInitials } from '../../utils/helpers';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

/** Round profile picture that falls back to the person's initials. */
const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const base = `${sizes[size]} rounded-full shrink-0 ${className}`;

  if (src && !failed) {
    return <img src={mediaUrl(src)} alt={name || 'Profile'} onError={() => setFailed(true)} className={`${base} object-cover`} />;
  }
  return (
    <div className={`${base} bg-gold-500 text-salon-dark font-semibold flex items-center justify-center`} aria-label={name}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
