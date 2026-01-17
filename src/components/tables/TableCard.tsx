import { cn } from '@/lib/utils';
import { Table } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TableCardProps {
  table: Table;
  onClick?: () => void;
  selected?: boolean;
  showOrder?: boolean;
}

export function TableCard({ table, onClick, selected, showOrder }: TableCardProps) {
  const statusClass = {
    available: 'table-available',
    occupied: 'table-occupied',
    reserved: 'table-reserved',
  }[table.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        statusClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        !onClick && 'cursor-default'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-2xl font-bold">{table.tableNumber}</h3>
          <p className="text-xs text-muted-foreground">{table.floor}</p>
        </div>
        <StatusBadge status={table.status} size="sm" showIcon={false} />
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{table.capacity}</span>
        </div>
        
        {table.status === 'reserved' && table.reservedFor && (
          <div className="flex items-center gap-1 text-table-reserved">
            <Clock className="w-4 h-4" />
            <span className="truncate max-w-[100px]">{table.reservedFor}</span>
          </div>
        )}
      </div>

      {showOrder && table.currentOrderId && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Active Order</p>
        </div>
      )}
    </button>
  );
}
