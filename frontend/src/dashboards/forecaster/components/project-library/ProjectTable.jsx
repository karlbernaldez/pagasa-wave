import { format } from "date-fns";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export default function ProjectTable({ projects, onOpen, onRename, onDelete }) {
  const [active, setActive] = useState(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
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
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {p.status}
                </span>
              </td>

              <td className="px-4 py-3 text-slate-600">
                {p.updatedAt ? format(new Date(p.updatedAt), "MMM d, yyyy hh:mm a") : "-"}
              </td>

              <td className="px-4 py-3 text-right relative">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onOpen(p)}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Open
                    <ExternalLink size={12} />
                  </button>

                  <button
                    onClick={() => setActive(active === p._id ? null : p._id)}
                    className="h-8 w-8 flex items-center justify-center rounded-md border"
                  >
                    <MoreHorizontal size={14} />
                  </button>
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
