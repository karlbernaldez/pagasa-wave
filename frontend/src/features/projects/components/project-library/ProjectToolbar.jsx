import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Filter, Search, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { ADMIN_STATUS_FILTERS, PROJECT_TYPE_FILTERS, STATUS_FILTERS } from "@/features/projects/constants/projectLibrary";
import { SORT_OPTIONS } from "./projectLibraryUtils";

const DATE_OPTIONS = [
  { value: "All", label: "All Time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function SelectControl({ label, value, onChange, options, isDarkMode = false }) {
  return (
    <label className="min-w-0 space-y-1.5">
      <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full min-w-0 rounded-lg border px-3 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 sm:min-w-[150px] ${
          isDarkMode
            ? "border-white/10 bg-slate-950 text-slate-100 focus:ring-blue-500/10"
            : "border-slate-200 bg-white text-slate-800 focus:ring-blue-50"
        }`}
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
  role = "forecaster",
  isDarkMode = false,
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
  isFetching,
}) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const statusFilterSource = role === "admin" ? ADMIN_STATUS_FILTERS : STATUS_FILTERS;
  const statusOptions = statusFilterSource.map((status) => ({
    value: status,
    label: status === "All" ? "All Statuses" : status,
  }));

  const searchControl = (
    <label className="min-w-0 space-y-1.5 md:col-span-2 xl:col-span-1">
      <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Search</span>
      <div className={`flex h-10 items-center gap-3 rounded-lg border px-3 transition focus-within:border-blue-400 focus-within:ring-4 ${
        isDarkMode
          ? "border-white/10 bg-slate-950 text-slate-100 focus-within:ring-blue-500/10"
          : "border-slate-200 bg-white text-slate-800 focus-within:ring-blue-50"
      }`}>
        <Search size={16} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={role === "admin" ? "Search projects or forecasters..." : "Search by title or description..."}
          className={`min-w-0 flex-1 bg-transparent text-sm font-semibold caret-blue-500 outline-none ${
            isDarkMode ? "text-slate-100 placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
          }`}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
            <X size={14} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />
          </button>
        )}
      </div>
    </label>
  );

  const filterControls = (
    <>
      <SelectControl label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} isDarkMode={isDarkMode} />
      <SelectControl label="Type" value={typeFilter} onChange={setTypeFilter} options={PROJECT_TYPE_FILTERS} isDarkMode={isDarkMode} />
      <SelectControl label="Date Range" value={dateRangeFilter} onChange={setDateRangeFilter} options={DATE_OPTIONS} isDarkMode={isDarkMode} />
    </>
  );

  const sortControls = (
    <div className={`flex flex-col gap-3 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center ${isDarkMode ? "border-white/10" : "border-slate-100"}`}>
      <span className={`text-xs font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Sort by</span>
      <select
        value={sortBy}
        onChange={(event) => setSortBy(event.target.value)}
        className={`h-9 w-full rounded-lg border px-3 text-xs font-bold outline-none focus:ring-4 sm:w-auto ${
          isDarkMode
            ? "border-white/10 bg-slate-950 text-slate-100 focus:ring-blue-500/10"
            : "border-slate-200 bg-white text-slate-700 focus:ring-blue-50"
        }`}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Button variant="ghost" size="sm" onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>
        {sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {sortDir === "asc" ? "Oldest" : "Newest"}
      </Button>

      {isFetching && (
        <span className={isDarkMode ? "text-xs text-slate-500" : "text-xs text-slate-400"}>Updating…</span>
      )}
    </div>
  );

  return (
    <section className={`rounded-xl border p-3 shadow-sm transition-colors sm:p-4 ${isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
      <div className="space-y-3 md:hidden">
        {searchControl}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button variant="secondary" size="md" onClick={() => setShowMobileFilters((value) => !value)}>
            <Filter size={16} />
            Filters ({activeFilterCount})
            <ChevronDown size={15} className={`ml-auto transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
          </Button>

          <Button variant="ghost" size="md" onClick={onClear}>
            Clear
          </Button>
        </div>

        {showMobileFilters && (
          <div className={`space-y-3 rounded-xl border p-3 ${isDarkMode ? "border-white/10 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
            {filterControls}
            {sortControls}
          </div>
        )}

        {!showMobileFilters && (
          <button
            type="button"
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className={`inline-flex items-center gap-2 text-xs font-black ${isDarkMode ? "text-cyan-300" : "text-blue-600"}`}
          >
            {sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {sortDir === "asc" ? "Oldest" : "Newest"}
          </button>
        )}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(260px,1.7fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_auto_auto] xl:items-end">
        {searchControl}
        {filterControls}

        <div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-2 xl:flex xl:items-center xl:justify-end">
          <Button variant="secondary" size="md">
            <Filter size={16} />
            Filters ({activeFilterCount})
          </Button>

          <Button variant="ghost" size="md" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-3 hidden md:block">{sortControls}</div>
    </section>
  );
}
