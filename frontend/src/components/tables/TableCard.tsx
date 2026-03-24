import { cn } from '@/lib/utils';
import { Table } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Users, Sparkles } from 'lucide-react';

interface TableCardProps {
  table: Table & { size?: string };
  onClick?: () => void;
  selected?: boolean;
  showOrder?: boolean;
  creatorName?: string;
}

export function TableCard({ table, onClick, selected, showOrder, creatorName }: TableCardProps) {
  const isSmall = !!table.size;
  const isAvailable = table.status === 'available';
  const isOccupied = table.status === 'occupied';

  return (
    <button
      onClick={onClick}
      data-testid={`table-${table.tableNumber}`}
      className={cn(
        'group relative rounded-2xl border-2 text-left transition-all duration-300 w-full overflow-hidden',
        'hover:scale-[1.03] active:scale-[0.97] hover:-translate-y-0.5',
        isSmall ? 'p-2 sm:p-3' : 'p-3 sm:p-4',
        isAvailable && 'table-available',
        isOccupied && 'table-occupied',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        !onClick && 'cursor-default'
      )}
    >
      {/* Decorative gradient overlay on hover */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
        isAvailable && 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5',
        isOccupied && 'bg-gradient-to-br from-amber-500/5 to-orange-500/5'
      )} />

      {/* Available sparkle indicator */}
      {isAvailable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
        </div>
      )}

      <div className={cn(
        "relative flex items-start justify-between gap-2",
        isSmall ? "mb-1 sm:mb-2" : "mb-2 sm:mb-3"
      )}>
        <div className="min-w-0">
          <h3 className={cn(
            "font-bold tracking-tight",
            isSmall ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
            isAvailable && "text-emerald-300",
            isOccupied && "text-amber-300"
          )}>{table.tableNumber}</h3>
        </div>
        <StatusBadge status={table.status} size="sm" showIcon={false} />
      </div>

      <div className="relative flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors",
          isAvailable && "bg-emerald-500/10",
          isOccupied && "bg-amber-500/10"
        )}>
          <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          <span className="font-medium">{table.capacity}</span>
        </div>
        {isOccupied && creatorName && (
          <div className="flex items-center gap-1 text-primary font-medium">
            <span className="text-muted-foreground/50 ml-0.5">•</span>
            <span className="truncate max-w-[80px] text-amber-400">{creatorName}</span>
          </div>
        )}
      </div>

      {showOrder && table.currentOrderIds.length > 0 && (
        <div className="relative mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {table.currentOrderIds.length} Active Order{table.currentOrderIds.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </button>
  );
}
