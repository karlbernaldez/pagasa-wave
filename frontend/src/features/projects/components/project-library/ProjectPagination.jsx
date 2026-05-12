import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildPageNumbers, cn } from "./utils";

export default function ProjectPagination({ page, total, totalPages, pageSize, onPageChange, isDarkMode = false }) {
  const safeTotal = Number(total) || 0;
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const hasPaginationButtons = safeTotalPages > 1;

  const first = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const last = safeTotal === 0 ? 0 : Math.min(safePage * safePageSize, safeTotal);
  const pageNumbers = hasPaginationButtons ? buildPageNumbers(safeTotalPages, safePage) : [];

  const navButtonClass = cn(
    "flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40",
    isDarkMode
      ? "border-white/10 text-slate-400 hover:bg-white/5"
      : "border-slate-200 text-slate-500 hover:bg-slate-100"
  );

  return (
    <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <p className={`text-sm font-medium tabular-nums ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        Showing {first} to {last} of {safeTotal} projects
      </p>

      {hasPaginationButtons && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className={navButtonClass}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-1.5">
            {pageNumbers.map((item, index) =>
              item === "…" ? (
                <span key={`ellipsis-${index}`} className={`flex h-9 w-9 items-center justify-center text-sm ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  className={cn(
                    "h-9 w-9 rounded-lg border text-sm font-bold transition",
                    safePage === item
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                      : isDarkMode
                        ? "border-white/10 text-slate-400 hover:bg-white/5"
                        : "border-slate-200 text-slate-500 hover:bg-slate-100"
                  )}
                  aria-label={`Go to page ${item}`}
                  aria-current={safePage === item ? "page" : undefined}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
            disabled={safePage === safeTotalPages}
            className={navButtonClass}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
