import { ArrowDown, ArrowUp, Filter, Search, X } from "lucide-react";
import { STATUS_FILTERS } from "./constants";
import { SORT_OPTIONS } from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

const TYPE_OPTIONS = [
  { value: "All", label: "All Types" },
  { value: "wave", label: "Wave" },
  { value: "wind", label: "Wind" },
  { value: "warning", label: "Warning" },
];

const DATE_OPTIONS = [
  { value: "All", label: "All Time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function SelectControl({ label, value, onChange, options }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ProjectToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  dateRangeFilter,
  setDateRangeFilter,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  activeFilterCount,
  onClear,
}) {
  const statusOptions = STATUS_FILTERS.map((status) => ({
    value: status,
    label: status === "All" ? "All Statuses" : status,
  }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[1.7fr_0.8fr_0.8fr_0.8fr_auto_auto] xl:items-end">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Search</span>
          <div className="flex h-10 items-center gap-3 rounded-lg border border-slate-200 px-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, region, or description..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>
        </label>

        <SelectControl label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <SelectControl label="Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
        <SelectControl label="Date Range" value={dateRangeFilter} onChange={setDateRangeFilter} options={DATE_OPTIONS} />

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700"
        >
          <Filter size={15} />
          Filters
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs">{activeFilterCount}</span>
        </button>

        <button type="button" onClick={onClear} className="h-10 px-2 text-sm font-bold text-blue-600 hover:text-blue-800">
          Clear
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        <span className="text-xs font-bold text-slate-500">Sort by</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-50"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          {sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          {sortDir === "asc" ? "Oldest First" : "Newest First"}
        </button>
      </div>
    </section>
  );
}
