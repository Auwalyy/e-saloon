import { motion } from 'framer-motion';

const tones = {
  gold: 'bg-gold-50 text-gold-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
};

/** Headline number for dashboards. `change` is a percentage versus the previous period; `compact` suits narrow tiles. */
const StatsCard = ({ title, value, icon: Icon, color = 'gold', change, changeLabel = 'vs last month', subtitle, delay = 0, compact = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className="card !p-5 hover:shadow-card-hover transition-shadow duration-200"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className={`text-gray-500 font-medium ${compact ? 'text-xs uppercase tracking-wide' : 'text-sm'}`}>{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {change !== undefined && change !== null && (
          <p className="text-xs mt-1 text-gray-500">
            <span className={`font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>{' '}
            {changeLabel}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`rounded-xl shrink-0 ${compact ? 'p-2' : 'p-3'} ${tones[color]}`}>
          <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} aria-hidden="true" />
        </div>
      )}
    </div>
  </motion.div>
);

export default StatsCard;
