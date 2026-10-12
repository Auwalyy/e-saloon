import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { rules } from '../../utils/validation';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';

/** Sign-in form. GuestRoute redirects once the session starts. */
const Login = () => {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to sign in'));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
      <p className="text-gray-500 mt-2">Sign in to manage your appointments.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email', rules.email)} />
        <div>
          <PasswordInput autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register('password', rules.required('Password'))} />
          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-sm text-gold-700 hover:underline">Forgot password?</Link>
          </div>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">Sign In</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        New here? <Link to="/register" className="text-gold-700 font-semibold hover:underline">Create an account</Link>
      </p>
    </div>
  );
};

export default Login;
