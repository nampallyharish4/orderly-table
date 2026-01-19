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

  const isSmall = table.size === 'small';
  const isSmallLeft = table.size === 'small-left';
  const isSmallRight = table.size === 'small-right';
  const isAnySmall = isSmall || isSmallLeft || isSmallRight;

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl border-2 text-left transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        isAnySmall ? 'w-1/2 p-2 sm:p-3' : 'w-full p-3 sm:p-4',
        isSmall && 'ml-auto',
        isSmallLeft && 'ml-auto',
        isSmallRight && 'mr-auto',
        statusClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        !onClick && 'cursor-default'
      )}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold">{table.tableNumber}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{table.floor}</p>
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
