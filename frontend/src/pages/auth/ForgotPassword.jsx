import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlineMailOpen } from 'react-icons/hi';
import { authService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { rules } from '../../utils/validation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

/** Requests a password reset link by email. */
const ForgotPassword = () => {
  const [sentTo, setSentTo] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await authService.forgotPassword(email);
      setSentTo(email);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (sentTo) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gold-50 flex items-center justify-center">
          <HiOutlineMailOpen className="w-8 h-8 text-gold-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-5">Check your email</h1>
        <p className="text-gray-500 mt-2">
          If an account exists for <span className="font-medium text-gray-700">{sentTo}</span>, we have sent a link to reset
          your password. The link expires in 30 minutes.
        </p>
        <Link to="/login" className="btn-primary mt-8">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Forgot your password?</h1>
      <p className="text-gray-500 mt-2">Enter your email and we will send you a reset link.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email', rules.email)} />
        <Button type="submit" loading={isSubmitting} className="w-full">Send Reset Link</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Remembered it? <Link to="/login" className="text-gold-700 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
