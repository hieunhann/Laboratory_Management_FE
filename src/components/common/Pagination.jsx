import React from "react";
import "./Pagination.css";

export default function CustomPagination({ current, pageSize, total, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, current - 2);
      let end = Math.min(totalPages, current + 2);

      if (current <= 3) {
        end = 5;
      } else if (current >= totalPages - 2) {
        start = totalPages - 4;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="custom-pagination">
      <button
        type="button"
        className="pagination-btn prev-btn"
        disabled={current === 1}
        onClick={() => onChange(current - 1, pageSize)}
      >
        Trang trước
      </button>

      <div className="pagination-pages">
        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${page}`}
              type="button"
              className={`pagination-number ${current === page ? "active" : ""}`}
              onClick={() => onChange(page, pageSize)}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="pagination-btn next-btn"
        disabled={current === totalPages}
        onClick={() => onChange(current + 1, pageSize)}
      >
        Trang sau
      </button>
    </div>
  );
}
