import React, { useState, useCallback, useRef } from "react";
import {
  X,
  Share2,
  Search,
  UserPlus,
  ChevronDown,
  Eye,
  Edit3,
  Shield,
  Check,
  Loader2,
  Users,
  Link2,
  Copy,
} from "lucide-react";

/* ─── Permission options ─────────────────────────────────────────────────── */

const PERMISSIONS = [
  {
    value: "view",
    label: "Can View",
    icon: Eye,
    description: "Read-only access",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
  },
  {
    value: "edit",
    label: "Can Edit",
    icon: Edit3,
    description: "View and make changes",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
  },
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    description: "Full project control",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
];

/* ─── Mock user search — replace with your real API call ─────────────────── */
const MOCK_USERS = [
  { id: 1, name: "Maria Santos",    email: "maria.santos@pagasa.dost.gov.ph",   avatar: "MS" },
  { id: 2, name: "Juan dela Cruz",  email: "juan.delacruz@pagasa.dost.gov.ph",  avatar: "JD" },
  { id: 3, name: "Ana Reyes",       email: "ana.reyes@pagasa.dost.gov.ph",      avatar: "AR" },
  { id: 4, name: "Carlo Mendoza",   email: "carlo.mendoza@pagasa.dost.gov.ph",  avatar: "CM" },
  { id: 5, name: "Liza Bautista",   email: "liza.bautista@pagasa.dost.gov.ph",  avatar: "LB" },
];

async function searchUsers(query) {
  await new Promise((r) => setTimeout(r, 280)); // simulated latency
  if (!query.trim()) return [];
  return MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );
}

/* ─── Avatar chip ────────────────────────────────────────────────────────── */
const AvatarChip = ({ initials, size = 8, isDarkMode }) => (
  <div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
      isDarkMode
        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
        : "bg-blue-100 text-blue-700 border border-blue-200"
    }`}
  >
    {initials}
  </div>
);

/* ─── Permission dropdown ────────────────────────────────────────────────── */
const PermissionSelect = ({ value, onChange, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const current = PERMISSIONS.find((p) => p.value === value) ?? PERMISSIONS[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          isDarkMode
            ? `${current.bg} ${current.border} ${current.color}`
            : `${current.bg} ${current.border} ${current.color}`
        }`}
      >
        <Icon size={11} strokeWidth={2.5} />
        {current.label}
        <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-2xl z-50 overflow-hidden ${
            isDarkMode
              ? "bg-[#0d1626] border-white/10"
              : "bg-white border-black/10"
          }`}
        >
          {PERMISSIONS.map((perm) => {
            const PIcon = perm.icon;
            return (
              <button
                key={perm.value}
                type="button"
                onClick={() => { onChange(perm.value); setOpen(false); }}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                  isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50"
                } ${value === perm.value ? (isDarkMode ? "bg-white/5" : "bg-slate-50") : ""}`}
              >
                <div className={`mt-0.5 p-1 rounded-md ${perm.bg}`}>
                  <PIcon size={10} strokeWidth={2.5} className={perm.color} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {perm.label}
                  </div>
                  <div className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
                    {perm.description}
                  </div>
                </div>
                {value === perm.value && (
                  <Check size={11} strokeWidth={2.5} className={`ml-auto mt-1 ${perm.color}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Main modal ─────────────────────────────────────────────────────────── */

const ShareProjectModal = ({ isOpen, onClose, onShare, projectName, isDarkMode }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);   // [{ ...user, permission }]
  const [globalPermission, setGlobalPermission] = useState("view");
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchTimer = useRef(null);

  const handleQueryChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const res = await searchUsers(val);
      // exclude already selected
      setResults(res.filter((u) => !selectedUsers.some((s) => s.id === u.id)));
      setSearching(false);
    }, 300);
  }, [selectedUsers]);

  const addUser = useCallback((user) => {
    setSelectedUsers((prev) => [...prev, { ...user, permission: globalPermission }]);
    setResults([]);
    setQuery("");
  }, [globalPermission]);

  const removeUser = useCallback((id) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const updateUserPermission = useCallback((id, permission) => {
    setSelectedUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, permission } : u))
    );
  }, []);

  const handleShare = useCallback(async () => {
    if (!selectedUsers.length) return;
    setSharing(true);
    await onShare({ users: selectedUsers, message });
    setSharing(false);
    setSelectedUsers([]);
    setMessage("");
  }, [selectedUsers, message, onShare]);

  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/project/${localStorage.getItem("projectId")}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  if (!isOpen) return null;

  const inputBase = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all placeholder:text-sm ${
    isDarkMode
      ? "bg-white/5 border-white/10 text-white placeholder-white/25 focus:border-cyan-500/50 focus:bg-white/8"
      : "bg-slate-50 border-black/10 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:bg-white"
  }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${
          isDarkMode
            ? "bg-[#080f1e] border border-white/10"
            : "bg-white border border-black/8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
            isDarkMode ? "border-white/8" : "border-black/8"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isDarkMode ? "bg-cyan-500/15 text-cyan-400" : "bg-blue-100 text-blue-600"
              }`}
            >
              <Share2 size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h2
                className={`text-sm font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Share Project
              </h2>
              <p
                className={`text-[10px] font-medium truncate max-w-[200px] ${
                  isDarkMode ? "text-white/40" : "text-slate-400"
                }`}
              >
                {projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-white/8 text-white/50 hover:text-white"
                : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            }`}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Search + default permission row */}
          <div>
            <label
              className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${
                isDarkMode ? "text-white/35" : "text-slate-400"
              }`}
            >
              Add People
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={13}
                  strokeWidth={2.5}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDarkMode ? "text-white/25" : "text-slate-300"
                  }`}
                />
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search by name or email…"
                  className={`${inputBase} pl-8 pr-3`}
                />
                {/* Dropdown results */}
                {(results.length > 0 || searching) && (
                  <div
                    className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-2xl z-50 overflow-hidden ${
                      isDarkMode
                        ? "bg-[#0d1626] border-white/10"
                        : "bg-white border-black/10"
                    }`}
                  >
                    {searching ? (
                      <div className={`flex items-center gap-2 px-4 py-3 text-xs ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
                        <Loader2 size={12} className="animate-spin" /> Searching…
                      </div>
                    ) : (
                      results.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => addUser(user)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50"
                          }`}
                        >
                          <AvatarChip initials={user.avatar} isDarkMode={isDarkMode} />
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                              {user.name}
                            </div>
                            <div className={`text-[10px] truncate ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
                              {user.email}
                            </div>
                          </div>
                          <UserPlus size={12} className={`ml-auto shrink-0 ${isDarkMode ? "text-cyan-400" : "text-blue-500"}`} />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Default permission for new additions */}
              <PermissionSelect
                value={globalPermission}
                onChange={setGlobalPermission}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>

          {/* Selected users list */}
          {selectedUsers.length > 0 && (
            <div>
              <div className={`flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-white/35" : "text-slate-400"}`}>
                <Users size={10} strokeWidth={2.5} />
                {selectedUsers.length} {selectedUsers.length === 1 ? "person" : "people"} selected
              </div>
              <div className="space-y-1.5">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
                      isDarkMode
                        ? "bg-white/3 border-white/8"
                        : "bg-slate-50 border-black/8"
                    }`}
                  >
                    <AvatarChip initials={user.avatar} isDarkMode={isDarkMode} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold truncate ${isDarkMode ? "text-white/90" : "text-slate-800"}`}>
                        {user.name}
                      </div>
                      <div className={`text-[10px] truncate ${isDarkMode ? "text-white/35" : "text-slate-400"}`}>
                        {user.email}
                      </div>
                    </div>
                    <PermissionSelect
                      value={user.permission}
                      onChange={(p) => updateUserPermission(user.id, p)}
                      isDarkMode={isDarkMode}
                    />
                    <button
                      type="button"
                      onClick={() => removeUser(user.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDarkMode
                          ? "hover:bg-white/8 text-white/30 hover:text-red-400"
                          : "hover:bg-red-50 text-slate-300 hover:text-red-500"
                      }`}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional message */}
          <div>
            <label
              className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${
                isDarkMode ? "text-white/35" : "text-slate-400"
              }`}
            >
              Message <span className={isDarkMode ? "text-white/20" : "text-slate-300"}>— optional</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note for your collaborators…"
              rows={2}
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* Copy link row */}
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
              isDarkMode ? "bg-white/3 border-white/8" : "bg-slate-50 border-black/8"
            }`}
          >
            <Link2
              size={13}
              strokeWidth={2.5}
              className={isDarkMode ? "text-white/30" : "text-slate-400"}
            />
            <span className={`flex-1 text-xs truncate ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
              Copy shareable link
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? isDarkMode
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : isDarkMode
                  ? "bg-white/8 hover:bg-white/12 text-white/60 hover:text-white border border-white/10"
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-black/10"
              }`}
            >
              {copied ? <><Check size={11} strokeWidth={2.5} /> Copied!</> : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-2 px-5 py-3 border-t shrink-0 ${
            isDarkMode ? "border-white/8" : "border-black/8"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDarkMode
                ? "border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                : "border-black/10 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={!selectedUsers.length || sharing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !selectedUsers.length || sharing
                ? isDarkMode
                  ? "bg-white/5 text-white/25 border border-white/8 cursor-not-allowed"
                  : "bg-slate-100 text-slate-300 border border-black/5 cursor-not-allowed"
                : isDarkMode
                ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50"
                : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
            }`}
          >
            {sharing ? (
              <><Loader2 size={12} className="animate-spin" /> Sharing…</>
            ) : (
              <><Share2 size={12} strokeWidth={2.5} /> Share Project</>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ShareProjectModal;