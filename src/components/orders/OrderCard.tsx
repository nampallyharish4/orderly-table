import { cn } from '@/lib/utils';
import { Order } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, User, MapPin, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  showItems?: boolean;
  compact?: boolean;
}

export function OrderCard({ order, onClick, showItems = false, compact = false }: OrderCardProps) {
  const timeAgo = formatDistanceToNow(order.createdAt, { addSuffix: true });
  const isReady = order.status === 'ready';
  const isTakeaway = order.orderType === 'takeaway';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full p-4 rounded-xl border border-border bg-card text-left transition-all',
          'hover:border-primary/50 hover:shadow-md active:scale-[0.99]',
          isReady && 'order-card-ready border-success/50'
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center font-bold',
              isTakeaway ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
            )}>
              {isTakeaway ? <Package className="w-6 h-6" /> : order.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{order.orderNumber}</span>
                <StatusBadge status={order.status} size="sm" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo}
                <span>•</span>
                <span>{order.items.length} items</span>
              </div>
            </div>
          </div>
          <span className="font-mono-price text-lg font-bold">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </button>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        isReady && 'order-card-ready border-success/50'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl',
              isTakeaway ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
            )}>
              {isTakeaway ? <Package className="w-7 h-7" /> : order.tableNumber}
            </div>
            <div>
              <h3 className="font-bold text-lg">{order.orderNumber}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {order.orderType}
              </p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Customer info for takeaway */}
        {isTakeaway && order.customerName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{order.customerName}</span>
            {order.customerPhone && (
              <span className="text-muted-foreground">• {order.customerPhone}</span>
            )}
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{timeAgo}</span>
        </div>

        {/* Items preview */}
        {showItems && (
          <div className="space-y-2 pt-2 border-t border-border">
            {order.items.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <span>{item.menuItemName}</span>
                </div>
                <StatusBadge status={item.status} size="sm" showIcon={false} />
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{order.items.length - 3} more items
              </p>
            )}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-mono-price text-xl font-bold text-primary">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
