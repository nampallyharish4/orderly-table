import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Order, hasPermission } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  User,
  Package,
  Printer,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { printBill } from '@/utils/printBill';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  showItems?: boolean;
  compact?: boolean;
}

export function OrderCard({
  order,
  onClick,
  showItems = false,
  compact = false,
}: OrderCardProps) {
  const { updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeAgo = formatDistanceToNow(order.createdAt, { addSuffix: true });
  const isReady = order.status === 'ready';
  const isTakeaway = order.orderType === 'takeaway';

  const isCompleted = ['served', 'collected'].includes(order.status);
  const canPrint = user?.role && hasPermission(user.role, 'print_bill');

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    printBill(order);
  };

  const handleMarkServed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // If the order was already paid upfront, handing it over means it's completely done
      if (order.payment?.status === 'completed') {
        await updateOrderStatus(order.id, 'collected');
      } else {
        await updateOrderStatus(order.id, 'served');
      }
      toast.success(
        isTakeaway
          ? 'Order handed over successfully'
          : 'Order marked as served',
      );
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update order status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div
        data-testid={`order-${order.orderNumber}`}
        className={cn(
          'w-full p-3 sm:p-4 rounded-xl border border-border bg-card text-left transition-all',
          'hover:border-primary/50 hover:shadow-md',
          isReady && 'order-card-ready border-success/50',
        )}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={onClick}
            className="flex items-center gap-2 sm:gap-3 flex-1 text-left min-w-0"
          >
            <div
              className={cn(
                'w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center font-bold shrink-0 text-sm sm:text-base',
                isTakeaway
                  ? 'bg-accent/20 text-accent'
                  : 'bg-primary/20 text-primary',
              )}
            >
              {isTakeaway ? (
                <Package className="w-5 sm:w-6 h-5 sm:h-6" />
              ) : (
                order.tableNumber
              )}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm sm:text-base truncate block">
                {order.orderNumber}
              </span>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">{timeAgo}</span>
                <span className="hidden xs:inline">•</span>
                <span className="hidden xs:inline">
                  {order.items.length} items
                </span>
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StatusBadge status={order.status} size="sm" />
            <span className="font-mono-price text-base sm:text-lg font-bold">
              ₹{order.totalAmount.toFixed(0)}
            </span>
            {isCompleted && canPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      onClick={onClick}
      data-testid={`order-${order.orderNumber}`}
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        isReady && 'order-card-ready border-success/50',
      )}
    >
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                'w-12 sm:w-14 h-12 sm:h-14 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl shrink-0',
                isTakeaway
                  ? 'bg-accent/20 text-accent'
                  : 'bg-primary/20 text-primary',
              )}
            >
              {isTakeaway ? (
                <Package className="w-6 sm:w-7 h-6 sm:h-7" />
              ) : (
                order.tableNumber
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg truncate">
                {order.orderNumber}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                {order.orderType}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-2">
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
              <span className="text-muted-foreground">
                • {order.customerPhone}
              </span>
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
            {order.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
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
            ₹{order.totalAmount.toFixed(0)}
          </span>
        </div>

        {/* Mark Served button for ready orders */}
        {isReady && (
          <Button
            className="w-full bg-success hover:bg-success/90"
            onClick={handleMarkServed}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isSubmitting
              ? 'Processing...'
              : isTakeaway
                ? 'Order Handed Over'
                : 'Mark Served'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
