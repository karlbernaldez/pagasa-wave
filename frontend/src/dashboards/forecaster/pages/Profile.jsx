import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, Building2, Briefcase,
  Calendar, Clock, Shield, ArrowLeft,
  BadgeCheck, Edit3, Fingerprint, UserCheck, Activity,
  Layers, Globe, Zap
} from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { loadHeaderUser } from "@shared/layouts/components/header/utils/userCache";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CFG = {
  active:    { label: "Active",    color: "#34d399", glow: "rgba(52,211,153,0.35)" },
  inactive:  { label: "Inactive",  color: "#6b7280", glow: "rgba(107,114,128,0.2)" },
  suspended: { label: "Suspended", color: "#f87171", glow: "rgba(248,113,113,0.3)" },
};

// ── Theme tokens ──────────────────────────────────────────────────────────────
function makeTheme(dark) {
  return {
    pageBg:        dark ? "#020816"                        : "#f1f5f9",
    bannerBg:      dark ? "linear-gradient(135deg,#051428 0%,#071d3d 40%,#0a1f3f 60%,#060e1e 100%)"
                        : "linear-gradient(135deg,#0ea5e9 0%,#2563eb 40%,#4f46e5 60%,#0284c7 100%)",
    cardBg:        dark ? "rgba(8,15,30,0.7)"              : "rgba(255,255,255,0.85)",
    cardBorder:    dark ? "rgba(255,255,255,0.07)"         : "rgba(0,0,0,0.07)",
    cardHeadBg:    dark ? "rgba(255,255,255,0.02)"         : "rgba(0,0,0,0.02)",
    cardHeadBorder:dark ? "rgba(255,255,255,0.06)"         : "rgba(0,0,0,0.06)",
    cardShadow:    dark ? "0 4px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
                        : "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
    textPrimary:   dark ? "#e2e8f0"  : "#0f172a",
    textSecondary: dark ? "#475569"  : "#64748b",
    textMuted:     dark ? "#334155"  : "#94a3b8",
    textLabel:     dark ? "#334155"  : "#94a3b8",
    iconAccentBg:  dark ? "rgba(56,189,248,0.12)"  : "rgba(14,165,233,0.1)",
    iconMutedBg:   dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    iconMutedColor:dark ? "#64748b"  : "#94a3b8",
    fieldHoverBg:  dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    statBg:        dark ? "rgba(8,15,30,0.6)"      : "rgba(255,255,255,0.8)",
    statBorder:    dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    idStripBg:     dark ? "rgba(8,15,30,0.7)"      : "rgba(255,255,255,0.9)",
    idStripBorder: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    avatarBg:      dark ? "linear-gradient(135deg,#0f1e38,#1a2d4a)" : "linear-gradient(135deg,#e0f2fe,#dbeafe)",
    avatarBorder:  dark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)",
    dotSep:        dark ? "#1e293b"  : "#cbd5e1",
    btnBackBg:     dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    btnBackBorder: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    btnBackColor:  dark ? "#64748b"  : "#64748b",
    btnEditBg:     dark ? "rgba(56,189,248,0.08)"  : "rgba(14,165,233,0.08)",
    btnEditBorder: dark ? "rgba(56,189,248,0.3)"   : "rgba(14,165,233,0.4)",
    gridColor:     dark ? "rgba(56,189,248,0.03)"  : "rgba(14,165,233,0.06)",
    aurora1:       dark ? "rgba(14,165,233,0.12)"  : "rgba(14,165,233,0.08)",
    aurora2:       dark ? "rgba(99,102,241,0.1)"   : "rgba(99,102,241,0.06)",
    pageBottom:    dark ? "#020816"  : "#f1f5f9",
  };
}

// ── AnimatedIn ────────────────────────────────────────────────────────────────
function AnimatedIn({ delay = 0, children }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
      {children}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, value, accent, t }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 14, transition: "background 0.2s", background: hov ? t.fieldHoverBg : "transparent" }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hov ? (accent ? "rgba(56,189,248,0.2)" : t.iconMutedBg) : (accent ? t.iconAccentBg : t.iconMutedBg),
        color: hov ? (accent ? "#7dd3fc" : "#94a3b8") : (accent ? "#38bdf8" : t.iconMutedColor),
        transition: "all 0.2s",
      }}>
        <Icon size={14} />
      </div>
      <div style={{ paddingTop: 2 }}>
        <p style={{ fontSize: 9, letterSpacing: "0.16em", fontWeight: 800, textTransform: "uppercase", color: t.textLabel, marginBottom: 4, fontFamily: "inherit" }}>
          {label}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, lineHeight: 1.4, fontFamily: "inherit" }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ title, icon: TitleIcon, children, delay = 0, t }) {
  return (
    <AnimatedIn delay={delay}>
      <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${t.cardBorder}`, background: t.cardBg, backdropFilter: "blur(20px)", boxShadow: t.cardShadow, transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${t.cardHeadBorder}`, background: t.cardHeadBg }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: t.iconAccentBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
            <TitleIcon size={11} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: t.textSecondary, fontFamily: "inherit" }}>
            {title}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: 8 }}>
          {children}
        </div>
      </div>
    </AnimatedIn>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 18px", borderRadius: 16, border: `1px solid ${t.statBorder}`, background: t.statBg, backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -8, right: -8, width: 48, height: 48, borderRadius: "50%", background: color, filter: "blur(20px)", opacity: 0.25 }} />
      <Icon size={14} color={color} />
      <p style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.02em", fontFamily: "inherit" }}>{value}</p>
      <p style={{ fontSize: 10, fontWeight: 600, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "inherit" }}>{label}</p>
    </div>
  );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const t = makeTheme(isDarkMode);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadHeaderUser()
      .then(({ currentUser, isLoggedIn }) => {
        if (cancelled) return;
        if (!isLoggedIn || !currentUser) { navigate("/login"); return; }
        setUser(currentUser);
      })
      .catch(() => { if (!cancelled) setError("Failed to load profile."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.pageBg }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #38bdf8", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        <p style={{ fontSize: 13, color: t.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>Loading profile…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.pageBg }}>
      <div style={{ textAlign: "center", padding: 32, borderRadius: 20, border: `1px solid ${t.cardBorder}`, background: t.cardBg }}>
        <p style={{ fontSize: 13, color: t.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, fontSize: 12, color: "#38bdf8", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Go back</button>
      </div>
    </div>
  );

  const status = STATUS_CFG[user?.status] ?? STATUS_CFG.inactive;
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.username;
  const memberYears = user?.activatedAt
    ? Math.floor((Date.now() - new Date(user.activatedAt)) / (365.25 * 24 * 3600000))
    : "—";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans','Outfit',system-ui,sans-serif", background: t.pageBg, color: t.textPrimary, paddingTop: 64, transition: "background 0.3s ease, color 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes aurora { 0%,100%{transform:translate(0,0) scale(1);opacity:.5} 33%{transform:translate(30px,-20px) scale(1.05);opacity:.7} 66%{transform:translate(-20px,15px) scale(.95);opacity:.4} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }
        @keyframes float-slow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .avatar-ring { animation: float-slow 6s ease-in-out infinite; }
        .status-dot  { animation: pulse-dot 2s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg,#e2e8f0 0%,#38bdf8 40%,#818cf8 60%,#e2e8f0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 4s linear infinite;
        }
        .shimmer-text-light {
          background: linear-gradient(90deg,#0f172a 0%,#0ea5e9 40%,#6366f1 60%,#0f172a 100%);
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
          <div style={{ height: 220, position: "relative", overflow: "hidden", background: t.bannerBg }}>
            {[160, 280, 400].map((s, i) => (
              <div key={i} style={{ position: "absolute", top: "50%", left: "60%", width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, borderRadius: "50%", border: `1px solid rgba(255,255,255,${0.1 - i * 0.025})` }} />
            ))}
            <div style={{ position: "absolute", top: "50%", left: "60%", width: 200, height: 1, transformOrigin: "left center", background: "linear-gradient(90deg,rgba(255,255,255,0.4),transparent)", transform: "rotate(-35deg)" }} />
            <div style={{ position: "absolute", bottom: 16, right: 24, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", lineHeight: 1.8 }}>
              14°37'N 121°00'E<br />PAGASA SCIENCE GARDEN
            </div>
            <div style={{ position: "absolute", top: 20, right: 24, fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}>
              STN-98300 ◆ WX-FORECASTER
            </div>
            <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, background: "linear-gradient(to bottom,transparent,rgba(255,255,255,0.5),transparent)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to bottom,transparent,${t.pageBg})` }} />
          </div>
        </AnimatedIn>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>

          {/* Profile header */}
          <AnimatedIn delay={100}>
            <div style={{ marginTop: -64, marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>

                {/* Avatar */}
                <div className="avatar-ring" style={{ position: "relative" }}>
                  <div style={{ position: "absolute", inset: -4, borderRadius: 26, background: `conic-gradient(from 180deg,${status.color}60,transparent,${status.color}30,transparent)`, filter: "blur(4px)" }} />
                  <div style={{ position: "relative", width: 112, height: 112, borderRadius: 22, border: `2px solid ${t.avatarBorder}`, background: t.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: `0 0 40px ${status.glow},0 20px 60px rgba(0,0,0,${isDarkMode ? 0.6 : 0.15})` }}>
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <User size={44} color={isDarkMode ? "#334155" : "#94a3b8"} />
                    }
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 60%)" }} />
                  </div>
                  <div className="status-dot" style={{ position: "absolute", bottom: 6, right: 6, width: 14, height: 14, borderRadius: "50%", background: status.color, border: `2.5px solid ${t.pageBg}`, boxShadow: `0 0 8px ${status.glow}` }} />
                </div>

                {/* Name */}
                <div style={{ paddingBottom: 4 }}>
                  <h1 className={isDarkMode ? "shimmer-text" : "shimmer-text-light"} style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, margin: 0 }}>
                    {fullName}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500 }}>@{user?.username}</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: t.dotSep }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, border: `1px solid ${status.color}40`, color: status.color, background: `${status.color}12` }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
                <button
                  onClick={() => navigate(-1)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: `1px solid ${t.btnBackBorder}`, background: t.btnBackBg, color: t.btnBackColor, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
                >
                  <ArrowLeft size={12} /> Back
                </button>
                <button
                  onClick={() => navigate("/edit-profile")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: `1px solid ${t.btnEditBorder}`, background: t.btnEditBg, color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(56,189,248,0.1)", transition: "all 0.15s", fontFamily: "inherit" }}
                >
                  <Edit3 size={12} /> Edit Profile
                </button>
              </div>
            </div>
          </AnimatedIn>

          {/* Badges row */}
          <AnimatedIn delay={200}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(56,189,248,0.2)", background: "rgba(56,189,248,0.08)", color: "#38bdf8" }}>
                <BadgeCheck size={10} strokeWidth={2.5} /> {user?.position}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.08)", color: "#a78bfa" }}>
                <Shield size={10} strokeWidth={2.5} /> {user?.role}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: t.dotSep }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: t.textSecondary, fontWeight: 500 }}>
                <UserCheck size={11} color="#38bdf8" /> Member since {formatDate(user?.activatedAt)}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: t.textMuted, fontWeight: 500 }}>
                <Clock size={11} /> Last seen {timeAgo(user?.lastLogin)}
              </span>
            </div>
          </AnimatedIn>

          {/* Stats */}
          <AnimatedIn delay={280}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
              <StatPill icon={Activity} label="Status"       value={status.label}         color={status.color} t={t} />
              <StatPill icon={Layers}   label="Years Active" value={memberYears}           color="#818cf8"      t={t} />
              <StatPill icon={Globe}    label="Agency"       value={user?.agency ?? "—"}   color="#38bdf8"      t={t} />
            </div>
          </AnimatedIn>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 64 }}>
            <Card title="Contact Information" icon={Mail} delay={320} t={t}>
              <Field icon={Mail}      label="Email Address" value={user?.email}   accent t={t} />
              <Field icon={Phone}     label="Contact No."   value={user?.contact} accent t={t} />
              <Field icon={MapPin}    label="Address"       value={user?.address}        t={t} />
              <Field icon={Building2} label="Agency"        value={user?.agency}         t={t} />
            </Card>

            <Card title="Professional Details" icon={Briefcase} delay={400} t={t}>
              <Field icon={Briefcase}  label="Position"     value={user?.position}              accent t={t} />
              <Field icon={Shield}     label="Role"         value={user?.role}                        t={t} />
              <Field icon={Calendar}   label="Birthday"     value={formatDate(user?.birthday)}         t={t} />
              <Field icon={UserCheck}  label="Member Since" value={formatDate(user?.activatedAt)} accent t={t} />
              <Field icon={Clock}      label="Last Login"   value={formatDateTime(user?.lastLogin)}    t={t} />
            </Card>

            {/* Account ID */}
            <AnimatedIn delay={480}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 20px", borderRadius: 20, border: `1px solid ${t.idStripBorder}`, background: t.idStripBg, backdropFilter: "blur(20px)", boxShadow: t.cardShadow, transition: "transform 0.3s ease" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(52,211,153,0.1)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(52,211,153,0.15)" }}>
                    <Fingerprint size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: t.textLabel, marginBottom: 4 }}>Account ID</p>
                    <p style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: t.textSecondary, letterSpacing: "0.05em" }}>{user?.id}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.08)" }}>
                  <Zap size={11} color="#34d399" />
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#34d399" }}>Verified</span>
                </div>
              </div>
            </AnimatedIn>
          </div>

        </div>
      </div>
    </div>
  );
}