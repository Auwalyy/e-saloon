import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { rules, applyServerErrors } from '../../utils/validation';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';

/** Customer registration: name, email, phone, password and confirmation. */
const Register = () => {
  const { register: createAccount } = useAuth();
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await createAccount(values);
      toast.success('Account created. Welcome!');
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to create your account'));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
      <p className="text-gray-500 mt-2">Book appointments and keep track of every visit.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input label="Full name" autoComplete="name" placeholder="Aisha Sule" error={errors.name?.message} {...register('name', rules.name)} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email', rules.email)} />
          <Input label="Phone" type="tel" autoComplete="tel" placeholder="0803 123 4567" error={errors.phone?.message} {...register('phone', rules.phone)} />
        </div>
        <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password', rules.password)} />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">Create Account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-gold-700 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
};

export default Register;
