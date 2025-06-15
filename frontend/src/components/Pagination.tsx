import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className = ''
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={`
        flex items-center justify-between
        ${className}
      `}
      aria-label="Pagination"
    >
      <div className="flex items-center">
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`
              relative inline-flex items-center px-2 py-2
              text-gray-400 hover:text-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="sr-only">First page</span>
            <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            relative inline-flex items-center px-2 py-2
            text-gray-400 hover:text-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <span className="sr-only">Previous page</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="hidden md:flex">
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              relative inline-flex items-center px-4 py-2 text-sm font-medium
              ${
                page === currentPage
                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }
              border
            `}
          >
            {page}
          </button>
        ))}
      </div>

      <div className="flex items-center">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            relative inline-flex items-center px-2 py-2
            text-gray-400 hover:text-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <span className="sr-only">Next page</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`
              relative inline-flex items-center px-2 py-2
              text-gray-400 hover:text-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="sr-only">Last page</span>
            <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Pagination; 