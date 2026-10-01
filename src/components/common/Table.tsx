import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  noScroll?: boolean;
  containerClassName?: string;
  tableClassName?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No records found',
  noScroll = false,
  containerClassName = '',
  tableClassName = '',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading records...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-slate-400 mb-2">
          <svg className="w-10 h-10 mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${noScroll ? 'overflow-hidden' : 'overflow-x-auto'} ${containerClassName}`}>
      <table className={`w-full divide-y divide-slate-200 text-left text-sm ${tableClassName}`}>
        <thead className="bg-slate-50/75">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={`px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap ${
                  col.headerClassName || col.className || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map(item => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick && onRowClick(item)}
              className={`transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : ''
              }`}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-3 sm:px-4 py-3.5 text-slate-700 ${col.className || ''}`}
                >
                  {col.render
                    ? col.render(item)
                    : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 sm:px-6">
      <div className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{startIdx}</span> to{' '}
        <span className="font-semibold text-slate-700">{endIdx}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> records
      </div>
      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`px-2.5 py-1 text-xs rounded font-medium ${
              currentPage === i + 1
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
