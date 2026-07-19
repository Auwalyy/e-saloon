import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { HiUser, HiPhone, HiLockClosed, HiCamera } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getInitials } from '../../utils/helpers';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone },
  });
  const { register: regPass, handleSubmit: handlePass, watch, reset: resetPass, formState: { errors: passErrors } } = useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const newPassword = watch('newPassword');

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const { data: res } = await authService.updateProfile(data);
      updateUser({ ...user, ...res.user });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPassLoading(true);
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      resetPass();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPassLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await authService.updateAvatar(formData);
      updateUser({ ...user, avatar: data.user.avatar });
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-salon-bg py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-8">My Profile</h1>

        {/* Avatar */}
        <div className="card mb-6 flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-gold-100">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gold-500 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(user?.name)}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-gold-600 transition-colors">
              {avatarLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiCamera className="w-3.5 h-3.5 text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge badge-gold capitalize mt-1">{user?.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['profile', 'password'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-gold-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {t === 'profile' ? 'Edit Profile' : 'Change Password'}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          {tab === 'profile' ? (
            <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
              <Input label="Full Name" icon={HiUser} error={profileErrors.name?.message}
                {...regProfile('name', { required: 'Name is required' })} />
              <div>
                <label className="label">Email Address</label>
                <input className="input bg-gray-50 cursor-not-allowed" value={user?.email} disabled />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <Input label="Phone Number" icon={HiPhone} error={profileErrors.phone?.message}
                {...regProfile('phone', { required: 'Phone is required' })} />
              <Button type="submit" loading={profileLoading}>Save Changes</Button>
            </form>
          ) : (
            <form onSubmit={handlePass(onPasswordSubmit)} className="space-y-4">
              <Input label="Current Password" type="password" icon={HiLockClosed} error={passErrors.currentPassword?.message}
                {...regPass('currentPassword', { required: 'Current password is required' })} />
              <Input label="New Password" type="password" icon={HiLockClosed} error={passErrors.newPassword?.message}
                {...regPass('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                  pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase & number' },
                })} />
              <Input label="Confirm New Password" type="password" icon={HiLockClosed} error={passErrors.confirmPassword?.message}
                {...regPass('confirmPassword', {
                  required: 'Please confirm password',
                  validate: v => v === newPassword || 'Passwords do not match',
                })} />
              <Button type="submit" loading={passLoading}>Change Password</Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
