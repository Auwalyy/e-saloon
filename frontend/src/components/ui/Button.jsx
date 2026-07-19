import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  danger: 'bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95',
  ghost: 'text-gray-600 hover:text-gold-600 hover:bg-gold-50 font-medium px-4 py-2 rounded-lg transition-all duration-200',
};

const sizes = {
  sm: 'text-sm px-4 py-2',
  md: '',
  lg: 'text-lg px-8 py-4',
};

const Button = ({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    className={`${variants[variant]} ${sizes[size]} ${className} disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading && (
      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {children}
  </motion.button>
);

export default Button;
