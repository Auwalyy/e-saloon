import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  danger: 'inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md',
  ghost: 'inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gold-700 hover:bg-gold-50 font-medium px-4 py-2 rounded-lg transition-all duration-200',
};

const sizes = {
  sm: '!text-sm !px-3.5 !py-2 !rounded-lg',
  md: '',
  lg: '!text-lg !px-8 !py-4',
};

/** Shared button with variants, sizes and a loading state. */
const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled, className = '', type = 'button', ...props }) => (
  <motion.button
    type={type}
    whileTap={{ scale: 0.97 }}
    className={`${variants[variant]} ${sizes[size]} ${className} disabled:opacity-60 disabled:cursor-not-allowed`}
    disabled={loading || disabled}
    {...props}
  >
    {loading && (
      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {children}
  </motion.button>
);

export default Button;
