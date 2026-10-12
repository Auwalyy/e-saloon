import Avatar from '../ui/Avatar';
import StarRating from '../ui/StarRating';
import { formatDate } from '../../utils/helpers';

/** A single customer review, with the salon's reply when there is one. */
const ReviewCard = ({ review }) => (
  <article className="card h-full flex flex-col">
    <StarRating rating={review.rating} size="md" />
    <p className="text-gray-600 mt-3 flex-1 leading-relaxed">
      {review.comment ? `"${review.comment}"` : <span className="text-gray-400 italic">No written comment</span>}
    </p>
    {review.reply && (
      <div className="mt-4 pl-4 border-l-2 border-gold-300 text-sm text-gray-500">
        <span className="font-medium text-gray-700">Reply from the salon:</span> {review.reply}
      </div>
    )}
    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
      <Avatar src={review.customer?.avatar} name={review.customer?.name} />
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{review.customer?.name || 'Customer'}</p>
        <p className="text-xs text-gray-500 truncate">
          {[review.service?.name, formatDate(review.createdAt)].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  </article>
);

export default ReviewCard;
