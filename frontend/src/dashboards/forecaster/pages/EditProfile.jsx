import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, Building2, Briefcase,
  ArrowLeft, Save, Camera, X, Check, AlertCircle,
  Shield, Calendar, Eye, EyeOff, Lock, RefreshCw
} from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { loadHeaderUser } from "@shared/layouts/components/header/utils/userCache";
import { updateUserDetailsAPI, changePasswordAPI } from "@/api/userAPI";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toInputDate(iso) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ── Theme tokens ──────────────────────────────────────────────────────────────
function makeTheme(dark) {
  return {
    pageBg: dark ? "#020816" : "#f1f5f9",
    bannerBg: dark ? "linear-gradient(135deg,#051428 0%,#071d3d 40%,#0a1f3f 60%,#060e1e 100%)"
      : "linear-gradient(135deg,#0ea5e9 0%,#2563eb 40%,#4f46e5 60%,#0284c7 100%)",
    cardBg: dark ? "rgba(8,15,30,0.7)" : "rgba(255,255,255,0.9)",
    cardBorder: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    cardHeadBg: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    cardHeadBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    cardShadow: dark ? "0 4px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)"
      : "0 4px 24px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.9)",
    textPrimary: dark ? "#e2e8f0" : "#0f172a",
    textSecondary: dark ? "#475569" : "#64748b",
    textLabel: dark ? "#334155" : "#94a3b8",
    inputBg: dark ? "rgba(8,15,30,0.6)" : "rgba(248,250,252,0.9)",
    inputBgFocus: dark ? "rgba(56,189,248,0.05)" : "rgba(224,242,254,0.6)",
    inputBgReadOnly: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    inputBorder: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)",
    inputColor: dark ? "#e2e8f0" : "#0f172a",
    inputReadOnly: dark ? "#334155" : "#94a3b8",
    iconColor: dark ? "#334155" : "#94a3b8",
    iconFocusColor: "#38bdf8",
    iconReadOnly: dark ? "#1e293b" : "#cbd5e1",
    hintColor: dark ? "#334155" : "#94a3b8",
    avatarBg: dark ? "linear-gradient(135deg,#0f1e38,#1a2d4a)" : "linear-gradient(135deg,#e0f2fe,#dbeafe)",
    avatarBorder: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    btnBackBg: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    btnBackBorder: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    btnBackColor: "#64748b",
    aurora1: dark ? "rgba(14,165,233,0.1)" : "rgba(14,165,233,0.08)",
    aurora2: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
    gridColor: dark ? "rgba(56,189,248,0.025)" : "rgba(14,165,233,0.06)",
    iconAccentBg: dark ? "rgba(56,189,248,0.12)" : "rgba(14,165,233,0.1)",
    pwBtnColor: dark ? "#334155" : "#94a3b8",
  };
}

// ── AnimatedIn ────────────────────────────────────────────────────────────────
function AnimatedIn({ delay = 0, children }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
      {children}
    </div>
  );
}

// ── FormInput ─────────────────────────────────────────────────────────────────
function FormInput({ icon: Icon, label, name, value, onChange, type = "text",
  placeholder, error, readOnly, hint, t }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPw = type === "password";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: readOnly ? t.iconReadOnly : t.textLabel, fontFamily: "inherit" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: readOnly ? t.iconReadOnly : focused ? t.iconFocusColor : t.iconColor, transition: "color 0.2s", pointerEvents: "none" }}>
          <Icon size={14} />
        </div>
        <input
          type={isPw && showPw ? "text" : type}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: isPw ? "11px 40px 11px 38px" : "11px 14px 11px 38px",
            borderRadius: 12,
            border: `1px solid ${error ? "rgba(248,113,113,0.5)" : focused ? "rgba(56,189,248,0.4)" : t.inputBorder}`,
            background: readOnly ? t.inputBgReadOnly : focused ? t.inputBgFocus : t.inputBg,
            color: readOnly ? t.inputReadOnly : t.inputColor,
            fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            outline: "none", transition: "all 0.2s",
            cursor: readOnly ? "not-allowed" : "text",
            boxShadow: focused && !readOnly ? "0 0 0 3px rgba(56,189,248,0.08)" : "none",
          }}
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: t.pwBtnColor, padding: 2 }}>
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {readOnly && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: t.iconReadOnly }}>
            <Lock size={12} />
          </div>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 11, color: "#f87171", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {hint && !error && (
        <p style={{ fontSize: 10, color: t.hintColor, fontFamily: "inherit" }}>{hint}</p>
      )}
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────
function SectionCard({ title, icon: TitleIcon, children, delay = 0, t }) {
  return (
    <AnimatedIn delay={delay}>
      <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${t.cardBorder}`, background: t.cardBg, backdropFilter: "blur(20px)", boxShadow: t.cardShadow }}>
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${t.cardHeadBorder}`, background: t.cardHeadBg }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: t.iconAccentBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
            <TitleIcon size={11} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: t.textSecondary, fontFamily: "inherit" }}>
            {title}
          </span>
        </div>
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {children}
        </div>
      </div>
    </AnimatedIn>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    setVis(true);
    const timer = setTimeout(() => { setVis(false); setTimeout(onDone, 400); }, 3200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div style={{
      position: "fixed", top: 88, right: 28,
      transform: `translateY(${vis ? 0 : -16}px)`,
      opacity: vis ? 1 : 0,
      transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 20px", borderRadius: 14,
      background: type === "success" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
      border: `1px solid ${type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
      color: type === "success" ? "#34d399" : "#f87171",
      fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap",
    }}>
      {type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

// ── EditProfilePage ───────────────────────────────────────────────────────────
export default function EditProfilePage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const t = makeTheme(isDarkMode);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    contact: "", address: "", agency: "",
    position: "", birthday: "",
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  useEffect(() => {
    let cancelled = false;
    loadHeaderUser()
      .then(({ currentUser, isLoggedIn }) => {
        if (cancelled) return;
        if (!isLoggedIn || !currentUser) { navigate("/login"); return; }
        setUser(currentUser);
        setForm(f => ({
          ...f,
          firstName: currentUser.firstName ?? "",
          lastName: currentUser.lastName ?? "",
          email: currentUser.email ?? "",
          contact: currentUser.contact ?? "",
          address: currentUser.address ?? "",
          agency: currentUser.agency ?? "",
          position: currentUser.position ?? "",
          birthday: toInputDate(currentUser.birthday),
        }));
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: undefined }));
    setDirty(true);
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (form.contact && !/^[\d\s\-\+\(\)]{7,15}$/.test(form.contact)) e.contact = "Enter a valid contact number.";
    if (form.newPassword) {
      if (!form.currentPassword) e.currentPassword = "Current password is required to set a new one.";
      if (form.newPassword.length < 8) e.newPassword = "Password must be at least 8 characters.";
      if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    }
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      // Step 1 — verify password FIRST; abort everything if it fails
      if (form.newPassword) {
        try {
          await changePasswordAPI(user.id, {
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          });
        } catch (pwErr) {
          const msg = pwErr.message?.toLowerCase();
          setErrors(e => ({
            ...e,
            currentPassword: msg?.includes("incorrect") || msg?.includes("wrong") || msg?.includes("invalid")
              ? "Incorrect current password."
              : pwErr.message,
          }));
          setToast({ message: pwErr.message, type: "error" });
          return;
        }
      }

      // Step 2 — save profile (only if password step passed or was skipped)
      const updated = await updateUserDetailsAPI(user.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        contact: form.contact.trim(),
        address: form.address.trim(),
        agency: form.agency.trim(),
        position: form.position.trim(),
        birthday: form.birthday || null,
      });

      setUser(prev => ({ ...prev, ...updated }));
      setForm(f => ({
        ...f,
        firstName: updated.firstName ?? f.firstName,
        lastName: updated.lastName ?? f.lastName,
        email: updated.email ?? f.email,
        contact: updated.contact ?? f.contact,
        address: updated.address ?? f.address,
        agency: updated.agency ?? f.agency,
        position: updated.position ?? f.position,
        birthday: toInputDate(updated.birthday) || f.birthday,
        currentPassword: "", newPassword: "", confirmPassword: "",
      }));
      setDirty(false);
      setToast({ message: "Profile updated successfully!", type: "success" });

      // redirect to profile after toast
      setTimeout(() => {
        navigate("/profile");
      }, 1200);

    } catch (err) {
      if (err.message?.toLowerCase().includes("email or username")) {
        setErrors(e => ({ ...e, email: "This email or username is already in use." }));
      }
      setToast({ message: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setToast({ message: "Image must be under 5 MB.", type: "error" }); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    // TODO: wire up avatar upload endpoint when available
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.pageBg }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #38bdf8", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        <p style={{ fontSize: 13, color: t.textSecondary, fontFamily: "'DM Sans',sans-serif" }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const displayAvatar = avatarPreview || user?.avatarUrl;
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.username;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif", background: t.pageBg, color: t.textPrimary, paddingTop: 64, transition: "background 0.3s ease, color 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes aurora  { 0%,100%{transform:translate(0,0) scale(1);opacity:.5} 33%{transform:translate(30px,-20px) scale(1.05);opacity:.7} 66%{transform:translate(-20px,15px) scale(.95);opacity:.4} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4) brightness(0.6); cursor: pointer; }
        .avatar-upload:hover .avatar-overlay { opacity: 1 !important; }
        .save-btn:hover:not(:disabled)  { background: rgba(56,189,248,0.18) !important; box-shadow: 0 0 32px rgba(56,189,248,0.2) !important; }
        .nav-btn:hover { opacity: 0.8; }
        .shimmer-edit {
          background: linear-gradient(90deg,#e2e8f0,#38bdf8 50%,#818cf8);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 4s linear infinite;
        }
        .shimmer-edit-light {
          background: linear-gradient(90deg,#0f172a,#0ea5e9 50%,#6366f1);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 4s linear infinite;
        }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: isDarkMode ? "radial-gradient(ellipse 80% 60% at 50% 0%,#051428 0%,#020816 60%)" : "radial-gradient(ellipse 80% 60% at 50% 0%,#dbeafe 0%,#f1f5f9 60%)" }} />
        <div style={{ position: "absolute", top: "5%", left: "15%", width: 600, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${t.aurora1} 0%,transparent 70%)`, animation: "aurora 12s ease-in-out infinite", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "10%", right: "10%", width: 500, height: 350, borderRadius: "50%", background: `radial-gradient(circle,${t.aurora2} 0%,transparent 70%)`, animation: "aurora 15s ease-in-out infinite reverse", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${t.gridColor} 1px,transparent 1px),linear-gradient(90deg,${t.gridColor} 1px,transparent 1px)`, backgroundSize: "40px 40px", WebkitMask: "radial-gradient(ellipse 70% 50% at 50% 30%,black,transparent)", mask: "radial-gradient(ellipse 70% 50% at 50% 30%,black,transparent)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Banner */}
        <AnimatedIn delay={0}>
          <div style={{ height: 160, position: "relative", overflow: "hidden", background: t.bannerBg }}>
            {[120, 220, 320].map((s, i) => (
              <div key={i} style={{ position: "absolute", top: "50%", left: "65%", width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, borderRadius: "50%", border: `1px solid rgba(255,255,255,${0.1 - i * 0.025})` }} />
            ))}
            <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3, background: "linear-gradient(to bottom,transparent,rgba(255,255,255,0.5),transparent)" }} />
            <div style={{ position: "absolute", top: 20, right: 24, fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}>
              EDIT MODE ◆ PROFILE
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to bottom,transparent,${t.pageBg})` }} />
          </div>
        </AnimatedIn>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>

          {/* Header */}
          <AnimatedIn delay={80}>
            <div style={{ marginTop: -52, marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", inset: -4, borderRadius: 26, background: "conic-gradient(from 180deg,rgba(56,189,248,0.5),transparent,rgba(56,189,248,0.2),transparent)", filter: "blur(4px)" }} />
                  <div className="avatar-upload" onClick={() => fileRef.current?.click()} style={{ position: "relative", cursor: "pointer" }}>
                    <div style={{ position: "relative", width: 100, height: 100, borderRadius: 20, border: `2px solid ${t.avatarBorder}`, background: t.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: `0 0 30px rgba(56,189,248,0.2),0 16px 48px rgba(0,0,0,${isDarkMode ? 0.6 : 0.12})` }}>
                      {displayAvatar
                        ? <img src={displayAvatar} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <User size={38} color={isDarkMode ? "#334155" : "#94a3b8"} />
                      }
                      <div className="avatar-overlay" style={{ position: "absolute", inset: 0, background: "rgba(2,8,22,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, opacity: 0, transition: "opacity 0.2s" }}>
                        {uploadingAvatar
                          ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #38bdf8", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                          : <><Camera size={16} color="#38bdf8" /><span style={{ fontSize: 9, fontWeight: 800, color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>Change</span></>
                        }
                      </div>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                </div>

                <div style={{ paddingBottom: 4 }}>
                  <h1 className={isDarkMode ? "shimmer-edit" : "shimmer-edit-light"} style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, margin: 0 }}>
                    Edit Profile
                  </h1>
                  <p style={{ fontSize: 12, color: t.textSecondary, marginTop: 5, fontFamily: "inherit" }}>@{user?.username}</p>
                  {dirty && (
                    <p style={{ fontSize: 10, color: "#f59e0b", marginTop: 5, display: "flex", alignItems: "center", gap: 4, animation: "pulse 2s ease-in-out infinite", fontFamily: "inherit" }}>
                      <RefreshCw size={9} /> Unsaved changes
                    </p>
                  )}
                </div>
              </div>

              {/* Buttons — dynamically switch between Discard and Back to Profile */}
              <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
                <button className="nav-btn" onClick={() => navigate("/profile")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 12,
                    border: `1px solid ${dirty ? "rgba(248,113,113,0.25)" : t.btnBackBorder}`,
                    background: dirty ? "rgba(248,113,113,0.07)" : t.btnBackBg,
                    color: dirty ? "#f87171" : t.btnBackColor,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                  }}>
                  {dirty ? <><X size={12} /> Discard</> : <><ArrowLeft size={12} /> Back to Profile</>}
                </button>
                <button className="save-btn" onClick={handleSave} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 12, border: "1px solid rgba(56,189,248,0.35)", background: saving ? "rgba(56,189,248,0.05)" : "rgba(56,189,248,0.12)", color: saving ? t.textSecondary : "#38bdf8", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 0 20px rgba(56,189,248,0.12)", fontFamily: "inherit", transition: "all .15s" }}>
                  {saving
                    ? <><div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${t.textSecondary}`, borderTopColor: "transparent", animation: "spin .7s linear infinite" }} /> Saving…</>
                    : <><Save size={12} /> Save Changes</>
                  }
                </button>
              </div>
            </div>
          </AnimatedIn>

          {/* Form sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 80 }}>

            <SectionCard title="Personal Information" icon={User} delay={160} t={t}>
              <FormInput icon={User} label="First Name" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Juan" error={errors.firstName} t={t} />
              <FormInput icon={User} label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} placeholder="dela Cruz" error={errors.lastName} t={t} />
              <FormInput icon={Calendar} label="Birthday" name="birthday" value={form.birthday} onChange={handleChange} type="date" error={errors.birthday} t={t} />
              <FormInput icon={Shield} label="Role" name="role" value={user?.role ?? ""} readOnly hint="Contact an admin to change your role." t={t} />
            </SectionCard>

            <SectionCard title="Contact Information" icon={Mail} delay={240} t={t}>
              <FormInput icon={Mail} label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" error={errors.email} t={t} />
              <FormInput icon={Phone} label="Contact No." name="contact" value={form.contact} onChange={handleChange} placeholder="09XXXXXXXXX" error={errors.contact} t={t} />
              <div style={{ gridColumn: "1 / -1" }}>
                <FormInput icon={MapPin} label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Street, City, Province" error={errors.address} t={t} />
              </div>
            </SectionCard>

            <SectionCard title="Professional Details" icon={Briefcase} delay={320} t={t}>
              <FormInput icon={Briefcase} label="Position" name="position" value={form.position} onChange={handleChange} placeholder="Forecaster" error={errors.position} t={t} />
              <FormInput icon={Building2} label="Agency" name="agency" value={form.agency} onChange={handleChange} placeholder="DOST-PAGASA" error={errors.agency} t={t} />
            </SectionCard>

            <SectionCard title="Change Password" icon={Lock} delay={400} t={t}>
              <FormInput icon={Lock} label="Current Password" name="currentPassword" value={form.currentPassword} onChange={handleChange} type="password" placeholder="Enter current password" error={errors.currentPassword} hint="Only required if setting a new password." t={t} />
              <FormInput icon={Lock} label="New Password" name="newPassword" value={form.newPassword} onChange={handleChange} type="password" placeholder="Min. 8 characters" error={errors.newPassword} t={t} />
              <div style={{ gridColumn: "1 / -1" }}>
                <FormInput icon={Lock} label="Confirm New Password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} type="password" placeholder="Repeat new password" error={errors.confirmPassword} t={t} />
              </div>
            </SectionCard>

            {/* Bottom save row */}
            <AnimatedIn delay={460}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button className="nav-btn" onClick={() => navigate("/profile")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "11px 20px", borderRadius: 12,
                    border: `1px solid ${dirty ? "rgba(248,113,113,0.25)" : t.btnBackBorder}`,
                    background: dirty ? "rgba(248,113,113,0.07)" : t.btnBackBg,
                    color: dirty ? "#f87171" : t.btnBackColor,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                  }}>
                  {dirty ? <><X size={13} /> Discard Changes</> : <><ArrowLeft size={13} /> Back to Profile</>}
                </button>
                <button className="save-btn" onClick={handleSave} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 24px", borderRadius: 12, border: "1px solid rgba(56,189,248,0.35)", background: saving ? "rgba(56,189,248,0.05)" : "rgba(56,189,248,0.12)", color: saving ? t.textSecondary : "#38bdf8", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 0 24px rgba(56,189,248,0.12)", fontFamily: "inherit", transition: "all .15s" }}>
                  {saving
                    ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${t.textSecondary}`, borderTopColor: "transparent", animation: "spin .7s linear infinite" }} /> Saving…</>
                    : <><Save size={13} /> Save Changes</>
                  }
                </button>
              </div>
            </AnimatedIn>

          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}