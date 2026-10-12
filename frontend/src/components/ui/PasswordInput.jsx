import { forwardRef, useState } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

/** Password field with a show / hide toggle (works with react-hook-form). */
const PasswordInput = forwardRef(({ label = 'Password', error, className = '', ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`input pr-11 ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
