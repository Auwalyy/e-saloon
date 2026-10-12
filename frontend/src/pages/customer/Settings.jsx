import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineBell, HiOutlineLockClosed, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import { authService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHero from '../../components/common/PageHero';
import Button from '../../components/ui/Button';

const PREFERENCES = [
  { key: 'email', title: 'Email notifications', description: 'Booking confirmations, reminders and status updates by email. Payment receipts and security emails are always sent.' },
  { key: 'sms', title: 'SMS notifications', description: 'Text message updates to the phone number on your profile.' },
];

/** Accessible on/off switch. */
const Toggle = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${checked ? 'bg-gold-500' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

/** Account settings: notification preferences, shortcuts to profile and password, and sign out. */
const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [savingKey, setSavingKey] = useState(null);
  const preferences = user.notificationPreferences || { email: true, sms: false };

  const setPreference = async (key, value) => {
    if (key === 'sms' && value && !user.phone) return toast.error('Add a phone number to your profile first');
    setSavingKey(key);
    try {
      const { user: updated } = await authService.updateProfile({ notificationPreferences: { [key]: value } });
      updateUser(updated);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save your preferences'));
    } finally {
      setSavingKey(null);
    }
  };

  const signOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <PageHero eyebrow="Your account" title="Settings" subtitle="Choose how we keep in touch and manage your account." />

      <section className="container-page py-10 max-w-3xl space-y-6">
        <div className="card">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <HiOutlineBell className="w-6 h-6 text-gold-600" /> Notifications
          </h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {PREFERENCES.map(({ key, title, description }) => (
              <li key={key} className="py-4 flex items-center justify-between gap-6">
                <div>
                  <p className="font-medium text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                </div>
                <Toggle label={title} checked={Boolean(preferences[key])} disabled={savingKey === key} onChange={(value) => setPreference(key, value)} />
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900">Account</h2>
          <ul className="mt-4 divide-y divide-gray-100">
            <li className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HiOutlineUser className="w-5 h-5 text-gold-600" />
                <div>
                  <p className="font-medium text-gray-900">Personal details</p>
                  <p className="text-sm text-gray-500">{user.name} · {user.email}</p>
                </div>
              </div>
              <Link to="/profile" className="btn-outline !text-sm">Edit</Link>
            </li>
            <li className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HiOutlineLockClosed className="w-5 h-5 text-gold-600" />
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-500">Change the password you use to sign in.</p>
                </div>
              </div>
              <Link to="/profile?tab=security" className="btn-outline !text-sm">Change</Link>
            </li>
            <li className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HiOutlineLogout className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Sign out</p>
                  <p className="text-sm text-gray-500">End your session on this device.</p>
                </div>
              </div>
              <Button variant="outline" className="!text-red-600" onClick={signOut}>Sign out</Button>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
};

export default Settings;
