import { format } from "date-fns";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

const STATUS_STYLE = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-amber-100 text-amber-700",
  "Under Review": "bg-orange-100 text-orange-700",
  Published: "bg-emerald-100 text-emerald-700",
};

export default function ProjectTable({
  projects,
  loading,
  error,
  onRetry,
  onOpen,
  onRename,
  onDelete,
}) {
  const [active, setActive] = useState(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 flex items-center justify-between">
        Failed to load projects
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No projects found
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 font-semibold">
          <tr>
            <th className="text-left px-4 py-3">Forecast Project</th>
            <th className="text-left px-4 py-3">Forecast Date</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Last Updated</th>
            <th className="text-right px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((p) => (
            <tr key={p._id} className="border-t hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>

              <td className="px-4 py-3 text-slate-600">
                {p.forecastDate ? format(new Date(p.forecastDate), "MMM d, yyyy") : "-"}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLE[p.status] || "bg-blue-50 text-blue-700"}`}
                >
                  {p.status}
                </span>
              </td>

              <td className="px-4 py-3 text-slate-600">
                {p.updatedAt ? format(new Date(p.updatedAt), "MMM d, yyyy hh:mm a") : "-"}
              </td>

              <td className="px-4 py-3 text-right relative">
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => onOpen(p)} icon={ExternalLink}>
                    Open
                  </Button>

                  <Button
                    variant="icon"
                    size="sm"
                    icon={MoreHorizontal}
                    aria-label="More actions"
                    onClick={() => setActive(active === p._id ? null : p._id)}
                  />
                </div>

                {active === p._id && (
                  <div className="absolute right-4 mt-2 w-32 rounded-md border bg-white shadow-md text-xs z-10">
                    <button
                      onClick={() => { setActive(null); onRename(p); }}
                      className="block w-full px-3 py-2 hover:bg-slate-50 text-left"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => { setActive(null); onDelete(p); }}
                      className="block w-full px-3 py-2 hover:bg-slate-50 text-left text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
