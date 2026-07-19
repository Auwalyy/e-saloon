import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiLockClosed } from 'react-icons/hi';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ResetPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const password = watch('password');

  const onSubmit = async ({ password }) => {
    if (!token) return toast.error('Invalid reset link');
    setLoading(true);
    try {
      await authService.resetPassword({ token, password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-gold-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-serif font-bold text-2xl">Aisha's Salon</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-1">Enter your new password below</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="New Password" type="password" icon={HiLockClosed} placeholder="Min 8 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Min 8 characters' },
                pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase & number' },
              })} />
            <Input label="Confirm Password" type="password" icon={HiLockClosed} placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm password',
                validate: v => v === password || 'Passwords do not match',
              })} />
            <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
