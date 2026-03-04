// studio/utils.js

/** Merge class names, filtering falsy values */
export const cn = (...classes) => classes.filter(Boolean).join(" ");

/**
 * Builds a compact array of page numbers with ellipsis markers.
 * e.g. [1, "…", 4, 5, 6, "…", 10]
 */
export function buildPageNumbers(totalPages, currentPage) {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);
}