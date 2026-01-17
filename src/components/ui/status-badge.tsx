import { cn } from '@/lib/utils';
import { OrderStatus, OrderItemStatus, TableStatus } from '@/types';
import { Clock, CheckCircle2, XCircle, ChefHat, Timer, Utensils } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus | OrderItemStatus | TableStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const orderStatusConfig: Record<OrderStatus, { label: string; class: string; icon: React.ElementType }> = {
  new: { label: 'New', class: 'status-new', icon: Clock },
  preparing: { label: 'Preparing', class: 'status-preparing', icon: ChefHat },
  ready: { label: 'Ready', class: 'status-ready', icon: CheckCircle2 },
  served: { label: 'Served', class: 'status-served', icon: Utensils },
  collected: { label: 'Collected', class: 'status-served', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: XCircle },
};

const itemStatusConfig: Record<OrderItemStatus, { label: string; class: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', class: 'status-new', icon: Timer },
  preparing: { label: 'Preparing', class: 'status-preparing', icon: ChefHat },
  ready: { label: 'Ready', class: 'status-ready', icon: CheckCircle2 },
};

const tableStatusConfig: Record<TableStatus, { label: string; class: string; icon: React.ElementType }> = {
  available: { label: 'Available', class: 'bg-table-available/15 text-table-available border-table-available/30', icon: CheckCircle2 },
  occupied: { label: 'Occupied', class: 'bg-table-occupied/15 text-table-occupied border-table-occupied/30', icon: Utensils },
  reserved: { label: 'Reserved', class: 'bg-table-reserved/15 text-table-reserved border-table-reserved/30', icon: Clock },
};

export function StatusBadge({ status, size = 'md', showIcon = true, className }: StatusBadgeProps) {
  const config = 
    orderStatusConfig[status as OrderStatus] || 
    itemStatusConfig[status as OrderItemStatus] ||
    tableStatusConfig[status as TableStatus];

  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.class,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
