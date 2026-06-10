import {
  X,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  ExternalLink,
  UserPlus,
  Eye,
  Layers3,
  GitBranch,
} from "lucide-react";
import { format } from "date-fns";

function formatDate(value) {
  if (!value) return "—";

  try {
    return format(
      new Date(value),
      "MMM d, yyyy"
    );
  } catch {
    return "—";
  }
}

function UserAvatar({
  avatarUrl,
  name,
  size = "h-10 w-10",
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${size} rounded-full border object-cover`}
      />
    );
  }

  return (
    <div
      className={`
        ${size}
        flex items-center justify-center
        rounded-full
        bg-cyan-500/15
        font-bold
        text-cyan-500
      `}
    >
      {(name || "?")
        .charAt(0)
        .toUpperCase()}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  isDarkMode,
}) {
  return (
    <div
      className={`
    rounded-2xl
    border
    p-3
    ${isDarkMode
          ? "border-white/10 bg-slate-900/50"
          : "border-slate-200 bg-white"
        }
  `}
    >
      <div className="mb-2 flex items-center gap-2 text-xs opacity-60">
        <Icon size={14} />
        {label}
      </div>

      <div className="text-lg font-black">
        {value}
      </div>
    </div>
  );
}

export default function ProjectDetailsDrawer({
  project,
  isDarkMode,
  onClose,
  onOpenProject,
  onManageCollaborators,
}) {
  if (!project) return null;

  const ownerName =
    project.owner
      ? `${project.owner.firstName || ""} ${project.owner.lastName || ""
        }`.trim()
      : "Unknown";

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside
        className={`
          relative
          h-full
          w-[400px]
          max-w-[90vw]
          overflow-y-auto
          border-l
          shadow-2xl
          ${isDarkMode
            ? "border-white/10 bg-[#0d1117] text-white"
            : "border-slate-200 bg-white text-slate-900"
          }
        `}
      >
        {/* HEADER */}

        <div
          className={`
            sticky top-0 z-20
            border-b
            px-5 py-5
            backdrop-blur
            ${isDarkMode
              ? "border-white/10 bg-[#0d1117]/95"
              : "border-slate-200 bg-white/95"
            }
          `}
        >
          <div className="flex items-start justify-between">
            <div>
              <span
                className="
                  rounded-full
                  bg-cyan-500/10
                  px-3 py-1
                  text-xs
                  font-bold
                  uppercase
                  text-cyan-500
                "
              >
                {project.status}
              </span>

              <h2
                className={`
                  mt-3
                  text-2xl
                  font-black
                  ${isDarkMode
                    ? "text-white"
                    : "text-slate-900"
                  }
                `}
              >
                {project.name}
              </h2>

              <p className="mt-1 text-sm opacity-60">
                Forecast Project
              </p>
            </div>

            <button
              aria-label="Close drawer"
              onClick={onClose}
              className="
                rounded-xl
                p-2
                hover:bg-black/10
              "
            >
              <X size={18} />
            </button>
          </div>

          {/* ACTIONS */}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onOpenProject?.(project)
              }
              className="
                flex items-center
                justify-center gap-2
                rounded-xl
                bg-cyan-500
                px-4 py-3
                font-bold
                text-white
                transition
                hover:bg-cyan-600
              "
            >
              <ExternalLink size={16} />
              Open
            </button>

            <button
              onClick={() =>
                onManageCollaborators?.(
                  project
                )
              }
              className="
                flex items-center
                justify-center gap-2
                rounded-xl
                border
                px-4 py-3
                font-semibold
              "
            >
              <UserPlus size={16} />
              Team
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5">

          {/* QUICK STATS */}

          <section>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Layers3}
                label="Charts"
                value={
                  project.charts?.length || 0
                }
                isDarkMode={isDarkMode}
              />

              <StatCard
                icon={Eye}
                label="Opens"
                value={
                  project.openCount || 0
                }
                isDarkMode={isDarkMode}
              />

              <StatCard
                icon={GitBranch}
                label="Version"
                value={
                  project.version || 1
                }
                isDarkMode={isDarkMode}
              />

              <StatCard
                icon={Users}
                label="Team"
                value={
                  project.collaborators
                    ?.length || 0
                }
                isDarkMode={isDarkMode}
              />
            </div>
          </section>

          {/* OWNER */}

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide opacity-60">
              Project Owner
            </h3>

            <div className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={
                    project.owner?.avatarUrl
                  }
                  name={ownerName}
                  size="h-12 w-12"
                />

                <div className="min-w-0">
                  <div className="font-bold">
                    {ownerName}
                  </div>

                  <div className="text-sm opacity-70">
                    {
                      project.owner
                        ?.position
                    }
                  </div>

                  <div className="truncate text-xs opacity-60">
                    {
                      project.owner
                        ?.email
                    }
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TIMELINE */}

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide opacity-60">
              Timeline
            </h3>

            <div className="space-y-2">
              <TimelineRow
                icon={Calendar}
                label="Forecast Date"
                value={formatDate(
                  project.forecastDate
                )}
              />

              <TimelineRow
                icon={Clock}
                label="Created"
                value={formatDate(
                  project.createdAt
                )}
              />

              <TimelineRow
                icon={Clock}
                label="Updated"
                value={formatDate(
                  project.updatedAt
                )}
              />
            </div>
          </section>

          {/* COLLABORATORS */}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide opacity-60">
                Team Members
              </h3>

              <button
                onClick={() =>
                  onManageCollaborators?.(
                    project
                  )
                }
                className="
                  text-xs
                  font-bold
                  text-cyan-500
                "
              >
                Invite
              </button>
            </div>

            {(project.collaborators || [])
              .length === 0 ? (
              <div className="rounded-2xl border p-4 text-sm opacity-60">
                No collaborators yet.
              </div>
            ) : (
              <div className="space-y-2">
                {project.collaborators.map(
                  (
                    collaborator
                  ) => {
                    const user =
                      collaborator.user;

                    const name = `${user?.firstName ||
                      ""
                      } ${user?.lastName ||
                      ""
                      }`.trim();

                    return (
                      <div
                        key={
                          user?._id
                        }
                        className="
                          flex items-center gap-3
                          rounded-2xl
                          border
                          p-3
                        "
                      >
                        <UserAvatar
                          avatarUrl={
                            user?.avatarUrl
                          }
                          name={
                            name ||
                            user?.email
                          }
                        />

                        <div className="min-w-0">
                          <div className="font-semibold">
                            {name ||
                              user?.email}
                          </div>

                          <div className="truncate text-xs opacity-60">
                            {
                              user?.email
                            }
                          </div>

                          <div className="text-xs font-medium text-cyan-500">
                            {collaborator.role ||
                              "Collaborator"}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* REVIEW */}

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide opacity-60">
              <MessageSquare size={14} />
              Review Notes
            </h3>

            <div
              className={`
                rounded-2xl
                border
                p-4
                text-sm
                leading-relaxed
                ${isDarkMode
                  ? "border-white/10 bg-slate-900"
                  : "border-slate-100 bg-slate-50"
                }
              `}
            >
              {project.reviewComment ||
                project
                  ?.latestReviewRemarks
                  ?.comment ||
                "No review comments available."}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function TimelineRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} />
        <span className="text-sm opacity-70">
          {label}
        </span>
      </div>

      <span className="text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}