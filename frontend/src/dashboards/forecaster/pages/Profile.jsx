import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Fingerprint,
  Globe,
  Layers,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  UserCheck,
} from 'lucide-react';

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

function getGlassClass(isDarkMode) {
  return isDarkMode
    ? 'border-cyan-300/30 bg-[#07335b]/54 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_22px_54px_rgba(0,0,0,0.24)]'
    : 'border-white/90 bg-white/66 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_22px_54px_rgba(15,74,105,0.16)]';
}

function InfoItem({ icon: Icon, label, value, isDarkMode, accent = false }) {
  return (
    <div className={`flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-white/60'}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${accent ? isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-300' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700' : isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-white/80 bg-white/70 text-slate-600'}`}>
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <dt className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}>{label}</dt>
        <dd className={`mt-1 break-words text-sm font-bold leading-5 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{value || '—'}</dd>
      </div>
    </div>
  );
}

function DetailCard({ children, icon: Icon, isDarkMode, title }) {
  return (
    <section className={`overflow-hidden rounded-2xl border backdrop-blur-3xl ${getGlassClass(isDarkMode)}`}>
      <div className={`flex items-center gap-3 border-b px-5 py-4 ${isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-white/75 bg-white/30'}`}>
        <span className={`grid h-8 w-8 place-items-center rounded-lg border ${isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-300' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700'}`}>
          <Icon size={15} aria-hidden="true" />
        </span>
        <h2 className={`text-sm font-black uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h2>
      </div>
      <dl className="grid gap-1 p-2 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function StatCard({ icon: Icon, isDarkMode, label, tone = 'cyan', value }) {
  const toneClass = tone === 'green'
    ? isDarkMode ? 'border-lime-300/25 bg-lime-400/10 text-lime-300' : 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
    : tone === 'violet'
      ? isDarkMode ? 'border-violet-300/20 bg-violet-400/10 text-violet-300' : 'border-violet-200 bg-violet-50/80 text-violet-700'
      : isDarkMode ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-300' : 'border-cyan-200 bg-cyan-50/80 text-cyan-700';

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-3xl ${getGlassClass(isDarkMode)}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-xl border ${toneClass}`}><Icon size={17} aria-hidden="true" /></span>
      <p className={`mt-4 truncate text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`} title={String(value)}>{value}</p>
      <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}>{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center p-6">
        <div className={`rounded-2xl border px-6 py-5 text-sm font-bold backdrop-blur-3xl ${getGlassClass(isDarkMode)} ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          <span className="inline-flex items-center gap-3"><span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />Loading profile…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[420px] place-items-center p-6">
        <div className={`max-w-md rounded-2xl border p-6 text-center backdrop-blur-3xl ${getGlassClass(isDarkMode)}`}>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{error}</p>
          <button type="button" onClick={() => navigate(-1)} className="mt-4 text-sm font-black text-cyan-600 hover:text-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Go back</button>
        </div>
      </div>
    );
  }

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Forecaster';
  const isActive = user?.status === 'active';
  const statusLabel = user?.status ? `${user.status.charAt(0).toUpperCase()}${user.status.slice(1)}` : 'Inactive';
  const yearsActive = user?.activatedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(user.activatedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : '—';

  return (
    <div className="relative min-h-full bg-transparent">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_42%_at_36%_8%,rgba(14,165,233,0.10),transparent_72%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1540px] space-y-5 p-4 sm:p-6 lg:px-8">
        <div>
          <h1 className={`text-2xl font-black tracking-tight sm:text-3xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Account Settings</h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Review your profile, contact details, role, and account activity.</p>
        </div>

        <section className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-3xl sm:p-6 ${getGlassClass(isDarkMode)}`}>
          <div className={`pointer-events-none absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(90%_110%_at_88%_-20%,rgba(34,211,238,0.12),transparent_52%)]' : 'bg-[radial-gradient(90%_110%_at_88%_-20%,rgba(255,255,255,0.85),transparent_54%)]'}`} aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative w-fit shrink-0">
                <div className={`grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border-2 ${isActive ? isDarkMode ? 'border-lime-300/55 shadow-[0_0_28px_rgba(163,230,53,0.12)]' : 'border-emerald-300 shadow-[0_12px_32px_rgba(5,150,105,0.14)]' : isDarkMode ? 'border-cyan-300/35' : 'border-cyan-200'} ${isDarkMode ? 'bg-slate-950/45' : 'bg-white/70'}`}>
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" /> : <User size={38} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />}
                </div>
                <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 ${isDarkMode ? 'border-[#07335b]' : 'border-white'} ${isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} aria-label={`Account status: ${statusLabel}`} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className={`truncate text-2xl font-black tracking-tight sm:text-3xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{fullName}</h1>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${isActive ? isDarkMode ? 'border-lime-300/30 bg-lime-400/10 text-lime-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700' : isDarkMode ? 'border-white/15 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                    <CheckCircle2 size={13} aria-hidden="true" />{statusLabel}
                  </span>
                </div>
                <p className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>@{user?.username || 'forecaster'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'border-cyan-300/25 bg-cyan-400/10 text-cyan-300' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700'}`}><BadgeCheck size={13} />{user?.position || 'Forecaster'}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'border-violet-300/20 bg-violet-400/10 text-violet-300' : 'border-violet-200 bg-violet-50/90 text-violet-700'}`}><Shield size={13} />{user?.role || 'Forecaster'}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => navigate(-1)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isDarkMode ? 'border-white/15 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]' : 'border-white/85 bg-white/65 text-slate-800 hover:bg-white/90'}`}><ArrowLeft size={16} />Back</button>
              <button type="button" onClick={() => navigate('/edit-profile')} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isDarkMode ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15' : 'border-cyan-200 bg-cyan-50/90 text-cyan-700 hover:bg-white'}`}><Edit3 size={16} />Edit Profile</button>
            </div>
          </div>

          <div className={`relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs font-semibold ${isDarkMode ? 'border-white/10 text-slate-300/80' : 'border-white/80 text-slate-600'}`}>
            <span className="inline-flex items-center gap-1.5"><UserCheck size={14} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />Member since {formatDate(user?.activatedAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={14} />Last seen {timeAgo(user?.lastLogin)}</span>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Account summary">
          <StatCard icon={Activity} label="Status" value={statusLabel} tone="green" isDarkMode={isDarkMode} />
          <StatCard icon={Layers} label="Years active" value={yearsActive} tone="violet" isDarkMode={isDarkMode} />
          <StatCard icon={Globe} label="Agency" value={user?.agency || '—'} isDarkMode={isDarkMode} />
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <DetailCard title="Contact information" icon={Mail} isDarkMode={isDarkMode}>
            <InfoItem icon={Mail} label="Email address" value={user?.email} accent isDarkMode={isDarkMode} />
            <InfoItem icon={Phone} label="Contact number" value={user?.contact} accent isDarkMode={isDarkMode} />
            <InfoItem icon={MapPin} label="Address" value={user?.address} isDarkMode={isDarkMode} />
            <InfoItem icon={Building2} label="Agency" value={user?.agency} isDarkMode={isDarkMode} />
          </DetailCard>

          <DetailCard title="Professional details" icon={Briefcase} isDarkMode={isDarkMode}>
            <InfoItem icon={Briefcase} label="Position" value={user?.position} accent isDarkMode={isDarkMode} />
            <InfoItem icon={Shield} label="Role" value={user?.role} isDarkMode={isDarkMode} />
            <InfoItem icon={Calendar} label="Birthday" value={formatDate(user?.birthday)} isDarkMode={isDarkMode} />
            <InfoItem icon={UserCheck} label="Member since" value={formatDate(user?.activatedAt)} accent isDarkMode={isDarkMode} />
            <InfoItem icon={Clock} label="Last login" value={formatDateTime(user?.lastLogin)} isDarkMode={isDarkMode} />
          </DetailCard>
        </div>

        <section className={`flex flex-col gap-4 rounded-2xl border p-4 backdrop-blur-3xl sm:flex-row sm:items-center sm:justify-between ${getGlassClass(isDarkMode)}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><Fingerprint size={18} /></span>
            <div className="min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-300/75' : 'text-slate-500'}`}>Account ID</p>
              <p className={`mt-1 truncate font-mono text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user?.id || user?._id || '—'}</p>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><BadgeCheck size={13} />Verified account</span>
        </section>
      </div>
    </div>
  );
}
