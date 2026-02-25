import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { X, UserPlus, User, Briefcase, Shield, ChevronRight, Check, Loader2, RotateCcw } from 'lucide-react';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../constants';
import { createUserAPI } from '@/api/userAPI';

/* ─────────────────────────────────────────────────────────────
   PURE HELPERS
───────────────────────────────────────────────────────────── */
const normalize = (arr = []) =>
  arr.map(o => (typeof o === 'string' ? { value: o, label: o } : o));

const slugify = (first = '', last = '') =>
  `${first}.${last}`.toLowerCase().replace(/\s+/g, '');

const capitalize = (str = '') =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

const labelFor = (list, value) =>
  list.find(o => o.value === value)?.label ?? value ?? '—';

const normalizeApiUser = (user) => ({
  id: user._id ?? user.id,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  contact: user.contact,
  agency: user.agency,
  position: user.position,
  role: user.role,
  status: user.status?.toLowerCase() ?? 'active',  // ✅ always lowercase
  memberSince: user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString(),
  lastLogin: user.lastLogin ?? null,
  activatedAt: user.activatedAt ?? null,
});

/* ─────────────────────────────────────────────────────────────
   VALIDATION RULES
   Each rule returns a string (error message) or null (pass).
   Layered approach:
     1. Threat patterns  — reject dangerous input first
     2. Format rules     — enforce expected shape
     3. Business rules   — domain-specific constraints
───────────────────────────────────────────────────────────── */

/** Detects common injection/XSS payloads in any field */
const THREAT_PATTERNS = [
  // XSS
  { re: /<[^>]*>/, msg: 'HTML tags are not allowed' },
  { re: /javascript\s*:/i, msg: 'Invalid characters detected' },
  { re: /on\w+\s*=/i, msg: 'Invalid characters detected' },
  // SQL injection
  { re: /('|--|;|\/\*|\*\/)/, msg: 'Invalid characters detected' },
  {
    re: /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CAST|CONVERT)\b/i,
    msg: 'Invalid characters detected'
  },
  // Path traversal
  { re: /\.\.[/\\]/, msg: 'Invalid characters detected' },
  // Null bytes
  { re: /\0/, msg: 'Invalid characters detected' },
];

const checkThreats = (value) => {
  for (const { re, msg } of THREAT_PATTERNS) {
    if (re.test(value)) return msg;
  }
  return null;
};

/** Sanitize display — strip leading/trailing whitespace and collapse inner spaces */
const sanitizeText = (str = '') => str.trim().replace(/\s{2,}/g, ' ');

const MAX_DATE = new Date();                             // not in the future
const MIN_DATE = new Date('1900-01-01');

const VALIDATORS = {
  username: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    if (v.length < 3) return 'At least 3 characters';
    if (v.length > 30) return 'Max 30 characters';
    if (!/^[a-z0-9._-]+$/.test(v)) return 'Only lowercase letters, numbers, dots, hyphens, underscores';
    if (/^[._-]|[._-]$/.test(v)) return 'Cannot start or end with a special character';
    if (/[._-]{2,}/.test(v)) return 'No consecutive special characters';
    return null;
  },

  firstName: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    if (v.trim().length < 2) return 'At least 2 characters';
    if (v.length > 50) return 'Max 50 characters';
    if (!/^[\p{L}\s'-]+$/u.test(v.trim())) return 'Letters, spaces, hyphens and apostrophes only';
    return null;
  },

  lastName: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    if (v.trim().length < 2) return 'At least 2 characters';
    if (v.length > 50) return 'Max 50 characters';
    if (!/^[\p{L}\s'-]+$/u.test(v.trim())) return 'Letters, spaces, hyphens and apostrophes only';
    return null;
  },

  email: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    if (v.length > 254) return 'Email too long';                  // RFC 5321
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
      return 'Invalid email address';
    // block disposable / obviously fake TLDs
    if (/\.(test|invalid|example|localhost)$/i.test(v))
      return 'Please use a real email address';
    return null;
  },

  birthday: (v) => {
    if (!v) return 'Required';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Invalid date';
    if (d > MAX_DATE) return 'Birthday cannot be in the future';
    if (d < MIN_DATE) return 'Birthday is too far in the past';
    // must be at least 18 years old
    const age = new Date().getFullYear() - d.getFullYear();
    if (age < 18) return 'User must be at least 18 years old';
    if (age > 100) return 'Please enter a valid birthday';
    return null;
  },

  contact: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    const digits = v.replace(/\D/g, '');
    if (digits.length < 7) return 'Too short to be a valid number';
    if (digits.length > 15) return 'Too long — max 15 digits (ITU-T E.164)';
    // allow: +63 912 345 6789 / 09123456789 / (02) 1234-5678
    if (!/^[+\d()\s-]+$/.test(v.trim())) return 'Invalid characters in contact number';
    return null;
  },

  address: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    if (v.trim().length < 5) return 'Please enter a complete address';
    if (v.length > 200) return 'Max 200 characters';
    return null;
  },

  agency: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    if (v.trim().length < 2) return 'At least 2 characters';
    if (v.length > 100) return 'Max 100 characters';
    return null;
  },

  position: (v) => {
    if (!v?.trim()) return 'Required';
    const t = checkThreats(v); if (t) return t;
    if (v.trim().length < 2) return 'At least 2 characters';
    if (v.length > 100) return 'Max 100 characters';
    return null;
  },
};

const REQUIRED = new Set(Object.keys(VALIDATORS));

/* ─────────────────────────────────────────────────────────────
   DRAFT PERSISTENCE
───────────────────────────────────────────────────────────── */
const DRAFT_KEY = 'addUserModal_draft';

const Draft = {
  save: (data) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { } },
  load: () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null'); } catch { return null; } },
  clear: () => { try { localStorage.removeItem(DRAFT_KEY); } catch { } },
};

/* ─────────────────────────────────────────────────────────────
   FORM CONFIG
───────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'account', label: 'Account', icon: Shield, fields: ['username', 'email', 'role', 'status'] },
  { id: 'personal', label: 'Personal', icon: User, fields: ['firstName', 'lastName', 'birthday', 'contact', 'address'] },
  { id: 'work', label: 'Work', icon: Briefcase, fields: ['agency', 'position'] },
];

const ROLES = normalize(ROLE_OPTIONS);
const STATUSES = normalize(STATUS_OPTIONS).filter(s => s.value !== 'All');
const ROLE_DEFAULT = ROLES[0]?.value ?? 'user';
const STATUS_DEFAULT = STATUSES[0]?.value ?? 'active';
const EMPTY_DEFAULTS = { role: ROLE_DEFAULT, status: STATUS_DEFAULT };

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */
function Field({ label, error, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }} className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-500">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[11px] text-rose-400 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
          {error}
        </span>
      )}
    </div>
  );
}

function Input({ className = '', maxLength, ...props }) {
  return (
    <input
      maxLength={maxLength}
      className={[
        'w-full px-3 py-2.5 rounded-lg border text-sm',
        'bg-slate-800/60 border-slate-700/80 text-slate-100 placeholder-slate-600',
        'focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30',
        'transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

function FormSelect({ options, className = '', ...props }) {
  return (
    <select
      className={[
        'w-full px-3 py-2.5 rounded-lg border text-sm',
        'bg-slate-800/60 border-slate-700/80 text-slate-100',
        'focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30',
        'transition-all duration-200 appearance-none cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export function AddUserModal({ isDarkMode = true, newUser = {}, setNewUser, onClose, onSubmit }) {
  const firstInputRef = useRef(null);
  const isMounted = useRef(false);
  const [activeSection, setActiveSection] = useState(0);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  /* ── mount: restore draft OR inject defaults ── */
  useEffect(() => {
    firstInputRef.current?.focus();
    const draft = Draft.load();
    const hasSavedData = draft && Object.values(draft).some(Boolean);

    if (hasSavedData) {
      setNewUser?.(() => ({
        ...draft,
        role: ROLES.find(r => r.value === draft.role)?.value ?? ROLE_DEFAULT,
        status: STATUSES.find(s => s.value === draft.status)?.value ?? STATUS_DEFAULT,
      }));
      setHasDraft(true);
    } else {
      setNewUser?.(() => ({ ...EMPTY_DEFAULTS }));
    }
    isMounted.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── scroll lock ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── auto-save draft ── */
  useEffect(() => {
    if (!isMounted.current) return;
    const { _usernameAuto, ...draftData } = newUser;
    Draft.save(draftData);
  }, [newUser]);

  /* ── auto-generate username ── */
  useEffect(() => {
    if (!newUser.firstName && !newUser.lastName) return;
    const auto = slugify(newUser.firstName, newUser.lastName);
    if (!newUser.username || newUser._usernameAuto) {
      setNewUser?.(prev => ({ ...prev, username: auto, _usernameAuto: true }));
    }
  }, [newUser.firstName, newUser.lastName]); // eslint-disable-line

  /* ── updaters ── */
  const update = useCallback((k, v) =>
    setNewUser?.(p => ({ ...p, [k]: v }))
    , [setNewUser]);

  const updateMany = useCallback((patch) =>
    setNewUser?.(p => ({ ...p, ...patch }))
    , [setNewUser]);

  const touch = useCallback(k =>
    setTouched(p => ({ ...p, [k]: true }))
    , []);

  const handleClearDraft = useCallback(() => {
    Draft.clear();
    setHasDraft(false);
    setTouched({});
    setActiveSection(0);
    setNewUser?.(() => ({ ...EMPTY_DEFAULTS }));
  }, [setNewUser]);

  /* ── validation ── */
  const errors = useMemo(() => {
    const e = {};
    for (const [field, validate] of Object.entries(VALIDATORS)) {
      const err = validate(newUser[field]);
      if (err) e[field] = err;
    }
    return e;
  }, [newUser]);

  const canSubmit = Object.keys(errors).length === 0;

  const sectionDone = useMemo(() =>
    SECTIONS.map(s => s.fields.every(f => !REQUIRED.has(f) || !errors[f]))
    , [errors]);

  /* ── submit ── */
  const handleSubmit = useCallback(async e => {
    e.preventDefault();

    // Touch all fields to surface every error at once
    if (!canSubmit) {
      setTouched(Object.fromEntries([...REQUIRED].map(f => [f, true])));
      // Jump to first section with an error
      const errFields = new Set(Object.keys(errors));
      const firstBadSection = SECTIONS.findIndex(s => s.fields.some(f => errFields.has(f)));
      if (firstBadSection !== -1) setActiveSection(firstBadSection);
      return;
    }

    setLoading(true);
    try {
      // Final sanitization pass before sending to API —
      // even though we validate on change, this is a last defense
      const { _usernameAuto, ...raw } = newUser;
      const payload = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? sanitizeText(v) : v])
      );

      const { user, defaultPassword } = await createUserAPI(payload);
      Draft.clear();
      alert(`User created.\nTemporary password: ${defaultPassword}`);
      onSubmit?.(normalizeApiUser(user));
      onClose?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [newUser, canSubmit, errors, onSubmit, onClose]);

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  /* ── render ── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(145deg,#0f1629 0%,#0c1220 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04),0 32px 64px rgba(0,0,0,0.6)',
          animation: 'modalIn 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform:scale(0.95) translateY(8px); }
            to   { opacity:1; transform:scale(1)    translateY(0);   }
          }
          input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.5); }
          select option { background:#0f1629; }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}>
                <UserPlus size={17} className="text-indigo-400" />
              </div>
              <div className="absolute -inset-0.5 rounded-xl opacity-30 blur-sm"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', zIndex: -1 }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-100 tracking-tight">Add New User</h4>
                {hasDraft && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                    Draft restored
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">All fields marked required by system</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasDraft && (
              <button type="button" onClick={handleClearDraft} title="Clear saved draft"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                  hover:text-amber-400 hover:bg-slate-800 transition-all duration-150">
                <RotateCcw size={14} />
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                hover:text-slate-300 hover:bg-slate-800 transition-all duration-150">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Section Tabs ── */}
        <div className="flex gap-1 px-6 pt-4">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            const active = activeSection === i;
            const done = sectionDone[i];
            // Show red dot on tab if it has touched errors
            const hasError = s.fields.some(f => touched[f] && errors[f]);
            return (
              <button key={s.id} type="button" onClick={() => setActiveSection(i)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  color: active ? '#a5b4fc' : hasError ? '#f87171' : done ? '#64748b' : '#475569',
                }}>
                {done && !active && !hasError
                  ? <Check size={12} className="text-emerald-500" />
                  : hasError && !active
                    ? <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    : <Icon size={12} />
                }
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 min-h-[320px]">

            {/* Section 0 — Account */}
            {activeSection === 0 && (
              <div className="grid grid-cols-2 gap-4" style={{ animation: 'modalIn 0.15s ease' }}>
                <Field label="Username *" error={touched.username && errors.username} span={2}>
                  <div className="relative">
                    <Input
                      ref={firstInputRef}
                      value={newUser.username || ''}
                      placeholder="john.doe"
                      maxLength={30}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      onBlur={() => touch('username')}
                      onChange={e => updateMany({ username: e.target.value, _usernameAuto: false })}
                    />
                    {newUser._usernameAuto && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-indigo-400/70 font-medium tracking-wide">
                        AUTO
                      </span>
                    )}
                  </div>
                </Field>

                <Field label="Email *" error={touched.email && errors.email} span={2}>
                  <Input
                    type="email"
                    value={newUser.email || ''}
                    placeholder="john.doe@agency.gov"
                    maxLength={254}
                    autoComplete="off"
                    onBlur={() => touch('email')}
                    onChange={e => update('email', e.target.value)}
                  />
                </Field>

                <Field label="Role">
                  <FormSelect options={ROLES} value={newUser.role || ROLE_DEFAULT}
                    onChange={e => update('role', e.target.value)} />
                </Field>

                <Field label="Status">
                  <FormSelect options={STATUSES} value={newUser.status || STATUS_DEFAULT}
                    onChange={e => update('status', e.target.value)} />
                </Field>
              </div>
            )}

            {/* Section 1 — Personal */}
            {activeSection === 1 && (
              <div className="grid grid-cols-2 gap-4" style={{ animation: 'modalIn 0.15s ease' }}>
                <Field label="First Name *" error={touched.firstName && errors.firstName}>
                  <Input
                    ref={firstInputRef}
                    value={newUser.firstName || ''}
                    placeholder="John"
                    maxLength={50}
                    autoComplete="given-name"
                    onBlur={() => touch('firstName')}
                    onChange={e => update('firstName', e.target.value)}
                  />
                </Field>

                <Field label="Last Name *" error={touched.lastName && errors.lastName}>
                  <Input
                    value={newUser.lastName || ''}
                    placeholder="Doe"
                    maxLength={50}
                    autoComplete="family-name"
                    onBlur={() => touch('lastName')}
                    onChange={e => update('lastName', e.target.value)}
                  />
                </Field>

                <Field label="Birthday *" error={touched.birthday && errors.birthday}>
                  <Input
                    type="date"
                    value={newUser.birthday || ''}
                    // Constrain the date picker UI to valid range
                    min="1900-01-01"
                    max={MAX_DATE.toISOString().split('T')[0]}
                    onBlur={() => touch('birthday')}
                    onChange={e => update('birthday', e.target.value)}
                  />
                </Field>

                <Field label="Contact *" error={touched.contact && errors.contact}>
                  <Input
                    value={newUser.contact || ''}
                    placeholder="+63 912 345 6789"
                    maxLength={20}
                    inputMode="tel"
                    autoComplete="tel"
                    onBlur={() => touch('contact')}
                    onChange={e => update('contact', e.target.value)}
                  />
                </Field>

                <Field label="Address *" error={touched.address && errors.address} span={2}>
                  <Input
                    value={newUser.address || ''}
                    placeholder="123 Main St, City, Province"
                    maxLength={200}
                    autoComplete="street-address"
                    onBlur={() => touch('address')}
                    onChange={e => update('address', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* Section 2 — Work */}
            {activeSection === 2 && (
              <div className="grid grid-cols-2 gap-4" style={{ animation: 'modalIn 0.15s ease' }}>
                <Field label="Agency *" error={touched.agency && errors.agency} span={2}>
                  <Input
                    ref={firstInputRef}
                    value={newUser.agency || ''}
                    placeholder="Department of…"
                    maxLength={100}
                    onBlur={() => touch('agency')}
                    onChange={e => update('agency', e.target.value)}
                  />
                </Field>

                <Field label="Position *" error={touched.position && errors.position} span={2}>
                  <Input
                    value={newUser.position || ''}
                    placeholder="Senior Weather Specialist"
                    maxLength={100}
                    onBlur={() => touch('position')}
                    onChange={e => update('position', e.target.value)}
                  />
                </Field>

                {/* Quick Review */}
                <div className="col-span-2 mt-2 rounded-xl p-4"
                  style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-indigo-400/70 mb-3">
                    Quick Review
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {[
                      ['Username', newUser.username],
                      ['Email', newUser.email],
                      ['Name', [newUser.firstName, newUser.lastName].filter(Boolean).join(' ')],
                      ['Role', labelFor(ROLES, newUser.role)],
                      ['Status', labelFor(STATUSES, newUser.status)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-14 shrink-0">{k}</span>
                        {v
                          ? <span className="text-xs text-slate-300 truncate">{v}</span>
                          : <span className="text-xs text-slate-600 italic">—</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>

            <div className="flex gap-1.5">
              {SECTIONS.map((_, i) => (
                <button key={i} type="button" onClick={() => setActiveSection(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: activeSection === i ? 20 : 6,
                    height: 6,
                    background: activeSection === i ? '#6366f1' : sectionDone[i] ? '#10b981' : '#1e293b',
                  }} />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-slate-400
                  hover:text-slate-200 hover:bg-slate-800 transition-all duration-150">
                Cancel
              </button>

              {activeSection < SECTIONS.length - 1 ? (
                <button type="button" onClick={() => setActiveSection(i => i + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-150"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button type="submit" disabled={!canSubmit || loading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold
                    text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: canSubmit && !loading ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b',
                    boxShadow: canSubmit && !loading ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                  }}>
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                    : <><Check size={14} /> Create User</>
                  }
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}