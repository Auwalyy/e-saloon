import { forwardRef } from 'react';

/** Multi-line text field matching the Input component (works with react-hook-form). */
const Textarea = forwardRef(({ label, error, rows = 4, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <textarea
      ref={ref}
      rows={rows}
      className={`input resize-y ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));

Textarea.displayName = 'Textarea';
export default Textarea;
