import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  width?: string;
  className?: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  pageSize?: number;
  emptyState?: ReactNode;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

type SortDir = 'asc' | 'desc';

export function Table<T>({
  columns,
  rows,
  rowKey,
  pageSize = 20,
  emptyState,
  rowClassName,
  onRowClick,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return rows;
    const arr = [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [rows, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-surface-2 border-b border-border">
              {columns.map((c) => {
                const sortable = !!c.sortValue;
                const isActive = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    style={{ width: c.width }}
                    className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary ${
                      c.align === 'right'
                        ? 'text-right'
                        : c.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    } ${sortable ? 'cursor-pointer hover:text-text-primary select-none' : ''} ${c.className ?? ''}`}
                    onClick={() => sortable && toggleSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {sortable ? (
                        isActive ? (
                          sortDir === 'asc' ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )
                        ) : (
                          <ChevronDown size={12} className="opacity-30" />
                        )
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-text-muted"
                >
                  {emptyState ?? 'No data.'}
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr
                  key={rowKey(r)}
                  className={`border-b border-border last:border-b-0 transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-bg-surface-2/50' : ''
                  } ${rowClassName ? rowClassName(r) : ''}`}
                  onClick={() => onRowClick?.(r)}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-2.5 align-middle ${
                        c.align === 'right'
                          ? 'text-right'
                          : c.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      } ${c.className ?? ''}`}
                    >
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs text-text-muted">
            Page {currentPage} of {totalPages} · {sorted.length} total
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-border bg-bg-surface text-text-secondary disabled:opacity-40 hover:bg-bg-surface-2"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-border bg-bg-surface text-text-secondary disabled:opacity-40 hover:bg-bg-surface-2"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
