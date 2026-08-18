import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Edit3,
  Fingerprint,
  Globe,
  Layers,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Shield,
  User,
  UserCheck,
  X,
} from 'lucide-react';

import {
  cancelEmailChangeAPI,
  requestEmailChangeAPI,
  resendEmailChangeAPI,
  updateUserDetailsAPI,
} from '@/api/userAPI';
import { useTheme } from '@/app/providers/ThemeProvider';
import { loadHeaderUser } from '@shared/layouts/components/header/utils/userCache';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(value) {
  if (!value) return '—';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '—';
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeEmail(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function createProfileForm(user = {}) {
  return {
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.pendingEmail || user.email || '',
    confirmEmail: '',
    emailCurrentPassword: '',
    contact: user.contact || '',
    address: user.address || '',
    agency: user.agency || '',
    position: user.position || '',
    birthday: toInputDate(user.birthday),
    avatarUrl: user.avatarUrl || '',
  };
}

function resizeProfileImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected file is not a valid image.'));
      image.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Image processing is not available in this browser.'));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function getGlassClass(isDarkMode) {
  return isDarkMode
    ? 'border-cyan-300/30 bg-[#07335b]/54 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_22px_54px_rgba(0,0,0,0.24)]'
    : 'border-white/90 bg-white/66 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_22px_54px_rgba(15,74,105,0.16)]';
}

function InfoItem({ icon: Icon, label, value, isDarkMode, accent = false }) {
  return (
    <div
      className={`flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-white/60'}`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${accent ? (isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-300' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700') : isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-white/80 bg-white/70 text-slate-600'}`}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <dt
          className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}
        >
          {label}
        </dt>
        <dd
          className={`mt-1 break-words text-sm font-bold leading-5 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
        >
          {value || '—'}
        </dd>
      </div>
    </div>
  );
}

function EditableField({
  autoComplete,
  error,
  icon: Icon,
  isDarkMode,
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}) {
  return (
    <label className="flex min-w-0 items-start gap-3 rounded-xl p-3">
      <span
        className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-300' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700'}`}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}
        >
          {label}
        </span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`mt-1.5 min-h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-cyan-300 ${error ? 'border-red-400' : isDarkMode ? 'border-white/15' : 'border-slate-200'} ${isDarkMode ? 'bg-slate-950/35 text-white placeholder:text-slate-500' : 'bg-white/80 text-slate-900 placeholder:text-slate-400'}`}
        />
        {error && <span className="mt-1 block text-xs font-semibold text-red-400">{error}</span>}
      </span>
    </label>
  );
}

function DetailCard({ children, icon: Icon, isDarkMode, title }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border backdrop-blur-3xl ${getGlassClass(isDarkMode)}`}
    >
      <div
        className={`flex items-center gap-3 border-b px-5 py-4 ${isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-white/75 bg-white/30'}`}
      >
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg border ${isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-300' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700'}`}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
        <h2
          className={`text-sm font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
        >
          {title}
        </h2>
      </div>
      <dl className="grid gap-1 p-2 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function StatCard({ icon: Icon, isDarkMode, label, tone = 'cyan', value }) {
  const toneClass =
    tone === 'green'
      ? isDarkMode
        ? 'border-lime-300/25 bg-lime-400/10 text-lime-300'
        : 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
      : tone === 'violet'
        ? isDarkMode
          ? 'border-violet-300/20 bg-violet-400/10 text-violet-300'
          : 'border-violet-200 bg-violet-50/80 text-violet-700'
        : isDarkMode
          ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-300'
          : 'border-cyan-200 bg-cyan-50/80 text-cyan-700';

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-3xl ${getGlassClass(isDarkMode)}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-xl border ${toneClass}`}>
        <Icon size={17} aria-hidden="true" />
      </span>
      <p
        className={`mt-4 truncate text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}
        title={String(value)}
      >
        {value}
      </p>
      <p
        className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}
      >
        {label}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailAction, setEmailAction] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(() => createProfileForm());
  const avatarInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadHeaderUser()
      .then(({ currentUser, isLoggedIn }) => {
        if (cancelled) return;
        if (!isLoggedIn || !currentUser) {
          navigate('/login');
          return;
        }
        setUser(currentUser);
        setForm(createProfileForm(currentUser));
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const currentEmail = normalizeEmail(user?.email);
  const pendingEmail = normalizeEmail(user?.pendingEmail);
  const enteredEmail = normalizeEmail(form.email);
  const emailChangeRequested = Boolean(
    currentEmail && enteredEmail && enteredEmail !== currentEmail && enteredEmail !== pendingEmail
  );

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setSaveError('');
    setSaveSuccess('');
  };

  const handleStartEditing = () => {
    setForm(createProfileForm(user));
    setFieldErrors({});
    setSaveError('');
    setSaveSuccess('');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setForm(createProfileForm(user));
    setFieldErrors({});
    setSaveError('');
    setSaveSuccess('');
    setIsEditing(false);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: 'Choose a JPG, PNG, or WebP image.',
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: 'Image must be smaller than 5 MB.',
      }));
      return;
    }
    try {
      const avatarUrl = await resizeProfileImage(file);
      setForm((current) => ({ ...current, avatarUrl }));
      setFieldErrors((current) => ({ ...current, avatarUrl: undefined }));
      setSaveError('');
      setSaveSuccess('');
    } catch (imageError) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: imageError?.message || 'Could not process the selected image.',
      }));
    }
  };

  const handleSaveProfile = async () => {
    const validationErrors = {};
    if (!form.firstName.trim()) validationErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) validationErrors.lastName = 'Last name is required.';
    if (!form.username.trim()) validationErrors.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9._-]{3,30}$/.test(form.username.trim())) {
      validationErrors.username = 'Use 3–30 letters, numbers, dots, underscores, or hyphens.';
    }
    if (!form.email.trim()) validationErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      validationErrors.email = 'Enter a valid email address.';
    }
    if (form.contact && !/^[\d\s+()-]{7,15}$/.test(form.contact)) {
      validationErrors.contact = 'Enter a valid contact number.';
    }
    if (emailChangeRequested) {
      if (!form.confirmEmail.trim()) {
        validationErrors.confirmEmail = 'Confirm the new email address.';
      } else if (normalizeEmail(form.confirmEmail) !== enteredEmail) {
        validationErrors.confirmEmail = 'Email addresses do not match.';
      }
      if (!form.emailCurrentPassword) {
        validationErrors.emailCurrentPassword =
          'Enter your current password to authorize this email change.';
      }
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    const userId = user?.id || user?._id;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const profilePayload = {
        username: form.username.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        contact: form.contact.trim(),
        address: form.address.trim(),
        agency: form.agency.trim(),
        position: form.position.trim(),
        birthday: form.birthday || null,
        avatarUrl: form.avatarUrl || null,
      };

      const profileResponse = await updateUserDetailsAPI(userId, profilePayload);
      const profileUser = profileResponse?.user || profileResponse || {};
      let mergedUser = { ...user, ...profilePayload, ...profileUser };

      if (emailChangeRequested) {
        const emailResponse = await requestEmailChangeAPI(userId, {
          newEmail: enteredEmail,
          currentPassword: form.emailCurrentPassword,
        });
        mergedUser = emailResponse.user ?? {
          ...mergedUser,
          pendingEmail: emailResponse.pendingEmail,
          pendingEmailVerificationExpires: emailResponse.pendingEmailVerificationExpires,
        };
      }

      setUser(mergedUser);
      setForm(createProfileForm(mergedUser));
      setIsEditing(false);
      setSaveSuccess(
        emailChangeRequested
          ? `Profile saved. Verify ${mergedUser.pendingEmail || enteredEmail} before it becomes your login email.`
          : 'Profile updated successfully.'
      );
    } catch (saveProfileError) {
      const message = saveProfileError?.message || 'Failed to update profile.';
      const normalizedMessage = message.toLowerCase();
      if (normalizedMessage.includes('email') && normalizedMessage.includes('use')) {
        setFieldErrors((current) => ({
          ...current,
          email: 'This email address is already in use.',
        }));
      }
      if (normalizedMessage.includes('incorrect current password')) {
        setFieldErrors((current) => ({
          ...current,
          emailCurrentPassword: 'Incorrect current password.',
        }));
      }
      if (normalizedMessage.includes('username')) {
        setFieldErrors((current) => ({
          ...current,
          username: 'This username is already in use.',
        }));
      }
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleResendEmailChange = async () => {
    if (!user?.pendingEmail || emailAction) return;
    setEmailAction('resend');
    setSaveError('');
    setSaveSuccess('');
    try {
      const response = await resendEmailChangeAPI(user.id || user._id);
      const nextUser = response.user ?? user;
      setUser(nextUser);
      setForm(createProfileForm(nextUser));
      setSaveSuccess(`Verification email resent to ${nextUser.pendingEmail || user.pendingEmail}.`);
    } catch (emailError) {
      setSaveError(emailError?.message || 'Failed to resend verification email.');
    } finally {
      setEmailAction(null);
    }
  };

  const handleCancelEmailChange = async () => {
    if (!user?.pendingEmail || emailAction) return;
    setEmailAction('cancel');
    setSaveError('');
    setSaveSuccess('');
    try {
      const response = await cancelEmailChangeAPI(user.id || user._id);
      const nextUser = response.user ?? { ...user, pendingEmail: null };
      setUser(nextUser);
      setForm(createProfileForm(nextUser));
      setSaveSuccess('Pending email change cancelled.');
    } catch (emailError) {
      setSaveError(emailError?.message || 'Failed to cancel the pending email change.');
    } finally {
      setEmailAction(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center p-6">
        <div
          className={`rounded-2xl border px-6 py-5 text-sm font-bold backdrop-blur-3xl ${getGlassClass(isDarkMode)} ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
        >
          <span className="inline-flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            Loading profile…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[420px] place-items-center p-6">
        <div
          className={`max-w-md rounded-2xl border p-6 text-center backdrop-blur-3xl ${getGlassClass(isDarkMode)}`}
        >
          <p
            className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 text-sm font-black text-cyan-600 hover:text-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const fullName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Forecaster';
  const isActive = user?.status === 'active';
  const statusLabel = user?.status
    ? `${user.status.charAt(0).toUpperCase()}${user.status.slice(1)}`
    : 'Inactive';
  const yearsActive = user?.activatedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(user.activatedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
      )
    : '—';

  return (
    <div className="relative min-h-full bg-transparent">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_42%_at_36%_8%,rgba(14,165,233,0.10),transparent_72%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1540px] space-y-5 p-4 sm:p-6 lg:px-8">
        <div>
          <h1
            className={`text-2xl font-black tracking-tight sm:text-3xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
          >
            Account Settings
          </h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Review your profile, contact details, role, and account activity.
          </p>
        </div>

        {(saveError || saveSuccess) && (
          <div
            role={saveError ? 'alert' : 'status'}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold backdrop-blur-2xl ${saveError ? (isDarkMode ? 'border-red-400/30 bg-red-950/35 text-red-200' : 'border-red-200 bg-red-50/90 text-red-700') : isDarkMode ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50/90 text-emerald-700'}`}
          >
            <span>{saveError || saveSuccess}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => {
                setSaveError('');
                setSaveSuccess('');
              }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <section
          className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-3xl sm:p-6 ${getGlassClass(isDarkMode)}`}
        >
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative w-fit shrink-0">
                <div
                  className={`grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border-2 ${isActive ? (isDarkMode ? 'border-lime-300/55' : 'border-emerald-300') : isDarkMode ? 'border-cyan-300/35' : 'border-cyan-200'} ${isDarkMode ? 'bg-slate-950/45' : 'bg-white/70'}`}
                >
                  {(isEditing ? form.avatarUrl : user?.avatarUrl) ? (
                    <img
                      src={isEditing ? form.avatarUrl : user.avatarUrl}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={38} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
                  )}
                </div>
                {isEditing && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black opacity-0 backdrop-blur-sm transition hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isDarkMode ? 'bg-slate-950/70 text-white' : 'bg-white/75 text-slate-900'}`}
                    >
                      <Camera size={20} />
                      Change photo
                    </button>
                  </>
                )}
              </div>

              <div className="min-w-0">
                {isEditing ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {['firstName', 'lastName'].map((name) => (
                      <label key={name} className="min-w-0">
                        <span
                          className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}
                        >
                          {name === 'firstName' ? 'First name' : 'Last name'}
                        </span>
                        <input
                          name={name}
                          value={form[name]}
                          onChange={handleFieldChange}
                          aria-invalid={Boolean(fieldErrors[name])}
                          className={`mt-1.5 min-h-10 w-full rounded-lg border px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-300 ${fieldErrors[name] ? 'border-red-400' : isDarkMode ? 'border-white/15 bg-slate-950/35 text-white' : 'border-slate-200 bg-white/80 text-slate-900'}`}
                        />
                        {fieldErrors[name] && (
                          <span className="mt-1 block text-xs font-semibold text-red-400">
                            {fieldErrors[name]}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <h1
                      className={`truncate text-2xl font-black tracking-tight sm:text-3xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}
                    >
                      {fullName}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${isActive ? (isDarkMode ? 'border-lime-300/30 bg-lime-400/10 text-lime-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700') : isDarkMode ? 'border-white/15 text-slate-300' : 'border-slate-200 text-slate-600'}`}
                    >
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {statusLabel}
                    </span>
                  </div>
                )}
                {isEditing ? (
                  <label className="mt-3 block max-w-sm">
                    <span
                      className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}
                    >
                      Username
                    </span>
                    <div
                      className={`mt-1.5 flex min-h-10 items-center rounded-lg border px-3 focus-within:ring-2 focus-within:ring-cyan-300 ${fieldErrors.username ? 'border-red-400' : isDarkMode ? 'border-white/15 bg-slate-950/35' : 'border-slate-200 bg-white/80'}`}
                    >
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>@</span>
                      <input
                        name="username"
                        value={form.username}
                        onChange={handleFieldChange}
                        aria-invalid={Boolean(fieldErrors.username)}
                        className={`min-w-0 flex-1 bg-transparent px-1 text-sm font-bold outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                    </div>
                    {fieldErrors.username && (
                      <span className="mt-1 block text-xs font-semibold text-red-400">
                        {fieldErrors.username}
                      </span>
                    )}
                  </label>
                ) : (
                  <p
                    className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    @{user?.username || 'forecaster'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold ${isDarkMode ? 'border-white/15 bg-white/[0.05] text-slate-200' : 'border-white/85 bg-white/65 text-slate-800'}`}
              >
                <ArrowLeft size={16} />
                Back
              </button>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={saving}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold disabled:opacity-50 ${isDarkMode ? 'border-white/15 bg-white/[0.05] text-slate-200' : 'border-white/85 bg-white/65 text-slate-800'}`}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black disabled:opacity-60 ${isDarkMode ? 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100' : 'border-cyan-300 bg-cyan-600 text-white'}`}
                  >
                    <Save size={16} />
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black ${isDarkMode ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700'}`}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div
            className={`relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs font-semibold ${isDarkMode ? 'border-white/10 text-slate-300/80' : 'border-white/80 text-slate-600'}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <UserCheck size={14} />
              Member since {formatDate(user?.activatedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              Last seen {timeAgo(user?.lastLogin)}
            </span>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Account summary">
          <StatCard
            icon={Activity}
            label="Status"
            value={statusLabel}
            tone="green"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={Layers}
            label="Years active"
            value={yearsActive}
            tone="violet"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon={Globe}
            label="Agency"
            value={user?.agency || '—'}
            isDarkMode={isDarkMode}
          />
        </section>

        {user?.pendingEmail && (
          <section
            className={`rounded-2xl border p-4 backdrop-blur-3xl ${isDarkMode ? 'border-amber-300/25 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50/90 text-amber-900'}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black">Email verification pending</p>
                <p className="mt-1 text-xs font-semibold opacity-80">
                  Current verified email: {user.email}. Verify {user.pendingEmail} before it becomes
                  your login email.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResendEmailChange}
                  disabled={Boolean(emailAction)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-cyan-300/30 px-3 text-xs font-black text-cyan-500 disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                  {emailAction === 'resend' ? 'Sending…' : 'Resend'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEmailChange}
                  disabled={Boolean(emailAction)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-300/30 px-3 text-xs font-black text-red-500 disabled:opacity-50"
                >
                  <X size={14} />
                  {emailAction === 'cancel' ? 'Cancelling…' : 'Cancel'}
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          <DetailCard title="Contact information" icon={Mail} isDarkMode={isDarkMode}>
            {isEditing ? (
              <EditableField
                icon={Mail}
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                error={fieldErrors.email}
                onChange={handleFieldChange}
                isDarkMode={isDarkMode}
              />
            ) : (
              <InfoItem
                icon={Mail}
                label="Email address"
                value={user?.email}
                accent
                isDarkMode={isDarkMode}
              />
            )}

            {isEditing ? (
              <EditableField
                icon={Phone}
                label="Contact number"
                name="contact"
                value={form.contact}
                error={fieldErrors.contact}
                onChange={handleFieldChange}
                isDarkMode={isDarkMode}
              />
            ) : (
              <InfoItem
                icon={Phone}
                label="Contact number"
                value={user?.contact}
                accent
                isDarkMode={isDarkMode}
              />
            )}

            {isEditing && emailChangeRequested && (
              <>
                <EditableField
                  icon={Mail}
                  label="Confirm new email"
                  name="confirmEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="Re-enter the new email"
                  value={form.confirmEmail}
                  error={fieldErrors.confirmEmail}
                  onChange={handleFieldChange}
                  isDarkMode={isDarkMode}
                />
                <EditableField
                  icon={Lock}
                  label="Current password"
                  name="emailCurrentPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Authorize this email change"
                  value={form.emailCurrentPassword}
                  error={fieldErrors.emailCurrentPassword}
                  onChange={handleFieldChange}
                  isDarkMode={isDarkMode}
                />
              </>
            )}

            {isEditing ? (
              <EditableField
                icon={MapPin}
                label="Address"
                name="address"
                value={form.address}
                onChange={handleFieldChange}
                isDarkMode={isDarkMode}
              />
            ) : (
              <InfoItem
                icon={MapPin}
                label="Address"
                value={user?.address}
                isDarkMode={isDarkMode}
              />
            )}

            {isEditing ? (
              <EditableField
                icon={Building2}
                label="Agency"
                name="agency"
                value={form.agency}
                onChange={handleFieldChange}
                isDarkMode={isDarkMode}
              />
            ) : (
              <InfoItem
                icon={Building2}
                label="Agency"
                value={user?.agency}
                isDarkMode={isDarkMode}
              />
            )}
          </DetailCard>

          <DetailCard title="Professional details" icon={Briefcase} isDarkMode={isDarkMode}>
            {isEditing ? (
              <EditableField
                icon={Briefcase}
                label="Position"
                name="position"
                value={form.position}
                onChange={handleFieldChange}
                isDarkMode={isDarkMode}
              />
            ) : (
              <InfoItem
                icon={Briefcase}
                label="Position"
                value={user?.position}
                accent
                isDarkMode={isDarkMode}
              />
            )}
            <InfoItem icon={Shield} label="Role" value={user?.role} isDarkMode={isDarkMode} />
            {isEditing ? (
              <EditableField
                icon={Calendar}
                label="Birthday"
                name="birthday"
                type="date"
                value={form.birthday}
                onChange={handleFieldChange}
                isDarkMode={isDarkMode}
              />
            ) : (
              <InfoItem
                icon={Calendar}
                label="Birthday"
                value={formatDate(user?.birthday)}
                isDarkMode={isDarkMode}
              />
            )}
            <InfoItem
              icon={UserCheck}
              label="Member since"
              value={formatDate(user?.activatedAt)}
              accent
              isDarkMode={isDarkMode}
            />
            <InfoItem
              icon={Clock}
              label="Last login"
              value={formatDateTime(user?.lastLogin)}
              isDarkMode={isDarkMode}
            />
          </DetailCard>
        </div>

        <section
          className={`flex flex-col gap-4 rounded-2xl border p-4 backdrop-blur-3xl sm:flex-row sm:items-center sm:justify-between ${getGlassClass(isDarkMode)}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
            >
              <Fingerprint size={18} />
            </span>
            <div className="min-w-0">
              <p
                className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}
              >
                Account ID
              </p>
              <p
                className={`mt-1 truncate font-mono text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
              >
                {user?.id || user?._id || '—'}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          >
            <BadgeCheck size={13} />
            Verified account
          </span>
        </section>
      </div>
    </div>
  );
}
