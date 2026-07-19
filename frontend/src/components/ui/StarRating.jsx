import { HiStar } from 'react-icons/hi';

const StarRating = ({ rating, max = 5, size = 'sm', interactive = false, onChange }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <HiStar
          key={i}
          className={`${sizes[size]} ${i < Math.round(rating) ? 'text-gold-500' : 'text-gray-200'} ${interactive ? 'cursor-pointer hover:text-gold-400' : ''}`}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
};

export default StarRating;
