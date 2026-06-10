/**
 * CollaboratorPanel
 *
 * Standalone slide-over panel for managing project collaborators.
 * Currently uses stub API calls (console.log) — wire up to your real
 * collaborator endpoints once the backend ships.
 *
 * Expected backend contract:
 *   POST   /api/projects/:id/collaborators   { email, role }
 *   DELETE /api/projects/:id/collaborators/:userId
 *   GET    /api/projects/:id/collaborators   → [{ user: { _id, firstName, lastName, email }, role, invitedAt }]
 */
import { useState, useCallback }
  from "react";

import {
  Users,
  X,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  COLLABORATOR_ROLES,
} from "../../constants/collaboratorRoles";

export default function CollaboratorPanel({ project, isDarkMode, onClose }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState(null); // userId being removed
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // TODO: replace with real API call + cache invalidation
  const [collaborators, setCollaborators] = useState(project?.collaborators || []);

  const bg = isDarkMode ? "bg-[#0d1117]" : "bg-white";
  const border = isDarkMode ? "border-white/10" : "border-slate-200";
  const text = isDarkMode ? "text-slate-100" : "text-slate-900";
  const subtext = isDarkMode ? "text-slate-400" : "text-slate-500";
  const input = isDarkMode
    ? "bg-slate-800 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500";
  const selectCls = isDarkMode
    ? "bg-slate-800 border-white/10 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  const handleInvite = useCallback(async () => {
    setError(""); setSuccess("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Enter an email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Enter a valid email address."); return; }
    if (collaborators.some(c => c.user?.email === trimmed)) { setError("This person is already a collaborator."); return; }

    setInviting(true);
    try {
      // TODO: replace with real API
      // const res = await fetch(`/api/projects/${project._id}/collaborators`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({ email: trimmed, role }),
      // });
      // if (!res.ok) throw new Error((await res.json()).message);
      // const { collaborator } = await res.json();

      // Optimistic local update (swap for real response when backend ships)
      const optimistic = {
        user: { _id: Date.now().toString(), firstName: trimmed.split("@")[0], lastName: "", email: trimmed },
        role,
        invitedAt: new Date().toISOString(),
        pending: true,
      };
      setCollaborators(prev => [...prev, optimistic]);
      setEmail(""); setRole("editor");
      setSuccess(`Invite sent to ${trimmed}.`);
    } catch (err) {
      setError(err?.message || "Failed to invite collaborator.");
    } finally {
      setInviting(false);
    }
  }, [email, role, collaborators, project]);

  const handleRemove = useCallback(async (userId) => {
    setError(""); setSuccess("");
    setRemoving(userId);
    try {
      // TODO: replace with real API
      // await fetch(`/api/projects/${project._id}/collaborators/${userId}`, {
      //   method: "DELETE", credentials: "include",
      // });
      setCollaborators(prev => prev.filter(c => c.user?._id !== userId));
    } catch (err) {
      setError(err?.message || "Failed to remove collaborator.");
    } finally {
      setRemoving(null);
    }
  }, [project]);

  const roleLabel = (r) => COLLAB_ROLES.find(cr => cr.value === r)?.label || r;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* panel */}
      <div className={`relative z-10 flex h-full w-full max-w-md flex-col border-l shadow-2xl ${bg} ${border}`}>
        {/* header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${border}`}>
          <div>
            <h2 className={`text-base font-black ${text}`}>
              <span className="inline-flex items-center gap-2"><Users size={18} className="text-cyan-500" />Collaborators</span>
            </h2>
            <p className={`mt-0.5 text-xs ${subtext}`}>{project?.name}</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-xl p-2 transition hover:bg-white/5 ${subtext}`}>
            <X size={18} />
          </button>
        </div>

        {/* invite form */}
        <div className={`border-b px-5 py-4 ${border}`}>
          <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${subtext}`}>Invite by email</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
              className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition ${input}`}
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className={`rounded-xl border px-2 py-2 text-sm outline-none ${selectCls}`}
            >
              {COLLAB_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>}
          {success && <p className="mt-2 text-xs font-semibold text-emerald-400">{success}</p>}

          <button
            type="button"
            disabled={inviting}
            onClick={handleInvite}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {inviting
              ? <><Loader2 size={15} className="animate-spin" />Inviting…</>
              : <><UserPlus size={15} />Send invite</>}
          </button>
        </div>

        {/* role descriptions */}
        <div className={`flex gap-4 border-b px-5 py-3 ${border}`}>
          {COLLAB_ROLES.map(r => (
            <div key={r.value} className="flex items-start gap-2">
              <r.icon size={13} className={isDarkMode ? "mt-0.5 text-slate-400" : "mt-0.5 text-slate-400"} />
              <div>
                <p className={`text-xs font-bold ${text}`}>{r.label}</p>
                <p className={`text-xs ${subtext}`}>{r.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* collaborator list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {collaborators.length === 0 ? (
            <div className={`flex flex-col items-center gap-2 py-12 text-center ${subtext}`}>
              <Users size={32} className="opacity-30" />
              <p className="text-sm">No collaborators yet.</p>
              <p className="text-xs">Invite someone above to get started.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {collaborators.map(c => {
                const user = c.user || {};
                const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
                const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
                return (
                  <li key={user._id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isDarkMode ? "border-white/10 bg-slate-900/60" : "border-slate-100 bg-slate-50"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isDarkMode ? "bg-cyan-500/20 text-cyan-300" : "bg-blue-100 text-blue-700"}`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${text}`}>{displayName}</p>
                      <p className={`truncate text-xs ${subtext}`}>{user.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.pending && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isDarkMode ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                          Pending
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                        {roleLabel(c.role)}
                      </span>
                      <button
                        type="button"
                        disabled={removing === user._id}
                        onClick={() => handleRemove(user._id)}
                        className={`rounded-lg p-1 transition ${isDarkMode ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"}`}
                        aria-label={`Remove ${displayName}`}
                      >
                        {removing === user._id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* footer note */}
        <div className={`border-t px-5 py-3 ${border}`}>
          <p className={`text-xs ${subtext}`}>
            Collaborators can access this project based on their assigned role. Only the project owner and admins can manage collaborators.
          </p>
        </div>
      </div>
    </div>
  );
}