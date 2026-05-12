export const cn = (...classes) => classes.filter(Boolean).join(" ");

export function buildPageNumbers(totalPages, currentPage) {
  return Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
    .reduce((pages, page, index, visiblePages) => {
      if (index > 0 && page - visiblePages[index - 1] > 1) pages.push("…");
      pages.push(page);
      return pages;
    }, []);
}
