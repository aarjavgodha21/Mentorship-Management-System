import React from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
  emptyMessage?: string;
}

function Table<T>({
  columns,
  data,
  sortColumn,
  sortDirection,
  onSort,
  className = '',
  emptyMessage = 'No data available'
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                scope="col"
                className={`
                  py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900
                  ${column.sortable ? 'cursor-pointer select-none' : ''}
                `}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="group inline-flex">
                  {column.header}
                  {column.sortable && (
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronUpIcon className="h-5 w-5 opacity-0 group-hover:opacity-100" aria-hidden="true" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-4 pl-4 pr-3 text-sm text-gray-500 text-center"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50"
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500"
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table; 