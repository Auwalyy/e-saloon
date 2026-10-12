import { motion } from 'framer-motion';

/** Fades a page in when the route changes. */
export const PageTransition = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

/** Reveals content as it scrolls into view. `delay` staggers items in a grid. */
export const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);
