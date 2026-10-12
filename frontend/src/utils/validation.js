/**
 * react-hook-form rules shared across forms. They mirror the API's validators
 * so users see problems instantly instead of after a round trip.
 */
export const rules = {
  name: {
    required: 'Name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' },
    maxLength: { value: 100, message: 'Name is too long' },
  },
  email: {
    required: 'Email is required',
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
  },
  phone: {
    required: 'Phone number is required',
    pattern: { value: /^\+?[0-9\s-]{7,20}$/, message: 'Enter a valid phone number' },
  },
  optionalPhone: {
    pattern: { value: /^$|^\+?[0-9\s-]{7,20}$/, message: 'Enter a valid phone number' },
  },
  password: {
    required: 'Password is required',
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/,
      message: 'Use 8+ characters with an uppercase letter, a lowercase letter and a number',
    },
  },
  required: (label) => ({ required: `${label} is required` }),
};

/** Copies field errors returned by the API (`errors: [{ field, message }]`) onto the form. */
export const applyServerErrors = (error, setError) => {
  const details = error?.response?.data?.errors;
  if (!Array.isArray(details)) return false;
  details.forEach(({ field, message }) => setError(field, { type: 'server', message }));
  return details.length > 0;
};
