import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildPageNumbers, cn } from "./utils";

export default function ProjectPagination({ page, total, totalPages, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const pageNumbers = buildPageNumbers(totalPages, page);

  return (
    <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-500 tabular-nums">
        Showing {first} to {last} of {total} projects
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex items-center gap-1.5">
          {pageNumbers.map((item, index) =>
            item === "…" ? (
              <span key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={cn(
                  "h-9 w-9 rounded-lg border text-sm font-bold transition",
                  page === item
                    ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                    : "border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
                aria-label={`Go to page ${item}`}
                aria-current={page === item ? "page" : undefined}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
