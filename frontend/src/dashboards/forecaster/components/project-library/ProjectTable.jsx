import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

export default function ProjectTable({ projects, onOpen }) {
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
                {p.forecastDate
                  ? format(new Date(p.forecastDate), "MMM d, yyyy")
                  : "-"}
              </td>

              <td className="px-4 py-3">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {p.status}
                </span>
              </td>

              <td className="px-4 py-3 text-slate-600">
                {p.updatedAt
                  ? format(new Date(p.updatedAt), "MMM d, yyyy hh:mm a")
                  : "-"}
              </td>

              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onOpen(p)}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Open
                  <ExternalLink size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
