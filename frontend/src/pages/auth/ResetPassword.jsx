import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { rules } from '../../utils/validation';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';

/** Sets a new password using the one-time token from the reset email. */
const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      const { message } = await authService.resetPassword({ token, ...values });
      toast.success(message);
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to reset your password'));
    }
  };

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">This link is not valid</h1>
        <p className="text-gray-500 mt-2">The password reset link is incomplete or has expired.</p>
        <Link to="/forgot-password" className="btn-primary mt-8">Request a new link</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Choose a new password</h1>
      <p className="text-gray-500 mt-2">Make it strong, and different from the last one.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <PasswordInput label="New password" autoComplete="new-password" error={errors.password?.message} {...register('password', rules.password)} />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">Reset Password</Button>
      </form>
    </div>
  );
};

export default ResetPassword;
