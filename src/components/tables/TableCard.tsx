import { cn } from '@/lib/utils';
import { Table } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Users } from 'lucide-react';

interface TableCardProps {
  table: Table & { size?: string };
  onClick?: () => void;
  selected?: boolean;
  showOrder?: boolean;
}

export function TableCard({ table, onClick, selected, showOrder }: TableCardProps) {
  const statusClass = {
    available: 'table-available',
    occupied: 'table-occupied',
  }[table.status];

  const isSmall = !!table.size;

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl border-2 text-left transition-all duration-200 w-full',
        'hover:scale-[1.02] active:scale-[0.98]',
        isSmall ? 'p-2 sm:p-3' : 'p-3 sm:p-4',
        statusClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        !onClick && 'cursor-default'
      )}
    >
      <div className={cn(
        "flex items-start justify-between gap-2",
        isSmall ? "mb-1 sm:mb-2" : "mb-2 sm:mb-3"
      )}>
        <div className="min-w-0">
          <h3 className={cn(
            "font-bold",
            isSmall ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
          )}>{table.tableNumber}</h3>
        </div>
        <StatusBadge status={table.status} size="sm" showIcon={false} />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-3 sm:w-4 h-3 sm:h-4" />
          <span>{table.capacity}</span>
        </div>
      </div>

      {showOrder && table.currentOrderIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {table.currentOrderIds.length} Active Order{table.currentOrderIds.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </button>
  );
}
