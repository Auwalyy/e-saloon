import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', icon: Icon, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />}
      <input
        ref={ref}
        className={`input ${Icon ? 'pl-10' : ''} ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
