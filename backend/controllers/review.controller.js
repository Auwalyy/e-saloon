/**
 * Reviews: customers review completed appointments; admins moderate and reply.
 */
const { Review, Appointment } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate } = require('../utils/helpers');
const notifications = require('../services/notification.service');

const POPULATE = [
  { path: 'customer', select: 'name avatar' },
  { path: 'service', select: 'name' },
  { path: 'employee', select: 'name' },
];

exports.getReviews = asyncHandler(async (req, res) => {
  const { status, rating, employee, mine, page, limit } = req.query;
  const isAdmin = req.user && req.user.role === 'admin';
  const filter = {};

  if (mine === 'true' && req.user) filter.customer = req.user._id;
  else if (!isAdmin) filter.isApproved = true;
  else if (status === 'approved') filter.isApproved = true;
  else if (status === 'pending') filter.isApproved = false;

  if (Number(rating) >= 1 && Number(rating) <= 5) filter.rating = Number(rating);
  if (employee) filter.employee = employee;

  // sort=top puts the highest-rated (then most recent) reviews first, e.g. for the home page.
  const sort = req.query.sort === 'top' ? '-rating -createdAt' : '-createdAt';
  const { items, pagination } = await paginate(Review, filter, { page, limit, sort, populate: POPULATE });

  // Public rating summary (approved reviews only).
  const [stats] = await Review.aggregate([
    { $match: { isApproved: true } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const distribution = await Review.aggregate([
    { $match: { isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: items,
    pagination,
    summary: {
      average: stats ? Math.round(stats.average * 10) / 10 : 0,
      count: stats ? stats.count : 0,
      distribution: [5, 4, 3, 2, 1].map((star) => ({
        rating: star,
        count: (distribution.find((row) => row._id === star) || { count: 0 }).count,
      })),
    },
  });
});

exports.createReview = asyncHandler(async (req, res) => {
  const { appointmentId, rating, comment } = req.body;
  const appointment = await Appointment.findOne({ _id: appointmentId, customer: req.user._id });
  if (!appointment) throw AppError.notFound('Appointment');
  if (appointment.status !== 'completed') throw AppError.badRequest('You can only review completed appointments');
  if (await Review.exists({ appointment: appointment._id })) {
    throw AppError.conflict('You have already reviewed this appointment');
  }

  const review = await Review.create({
    customer: req.user._id,
    appointment: appointment._id,
    service: appointment.service,
    employee: appointment.employee,
    rating,
    comment,
  });
  notifications.dispatch(notifications.onReviewSubmitted(req.user, review));
  res.status(201).json({
    success: true,
    message: 'Thank you! Your review will appear once it has been approved.',
    data: await review.populate(POPULATE),
  });
});

/** Admin: approve / hide a review and optionally reply to it. */
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw AppError.notFound('Review');

  if (req.body.isApproved !== undefined) review.isApproved = Boolean(req.body.isApproved);
  if (req.body.reply !== undefined) review.reply = req.body.reply;
  await review.save();
  await Review.refreshEmployeeRating(review.employee);

  if (req.body.isApproved === true) {
    notifications.dispatch(notifications.notifyUser(review.customer, {
      type: 'review', title: 'Your review was published', message: 'Thank you for sharing your experience.', link: '/reviews',
    }));
  }
  res.json({ success: true, message: 'Review updated', data: await review.populate(POPULATE) });
});

/** Admins can delete any review; customers only their own. */
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw AppError.notFound('Review');
  if (req.user.role !== 'admin' && String(review.customer) !== req.user.id) throw AppError.notFound('Review');

  await review.deleteOne();
  await Review.refreshEmployeeRating(review.employee);
  res.json({ success: true, message: 'Review deleted' });
});
