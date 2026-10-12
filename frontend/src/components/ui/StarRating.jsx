import { HiStar } from 'react-icons/hi';

const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };

/** Star display. Pass `onChange` to turn it into a rating input. */
const StarRating = ({ rating = 0, max = 5, size = 'sm', onChange }) => {
  const stars = Array.from({ length: max }, (_, index) => index + 1);

  if (!onChange) {
    return (
      <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of ${max} stars`}>
        {stars.map((star) => (
          <HiStar key={star} className={`${sizes[size]} ${star <= Math.round(rating) ? 'text-gold-500' : 'text-gray-200'}`} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === rating}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <HiStar className={`${sizes[size]} ${star <= rating ? 'text-gold-500' : 'text-gray-200 hover:text-gold-300'}`} />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
