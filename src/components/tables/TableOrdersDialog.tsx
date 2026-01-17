import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { Table, Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Clock, ShoppingCart, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TableOrdersDialogProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TableOrdersDialog({ table, open, onOpenChange }: TableOrdersDialogProps) {
  const { orders, createOrder } = useOrders();
  const navigate = useNavigate();

  if (!table) return null;

  const tableOrders = orders.filter(
    order => table.currentOrderIds.includes(order.id) && 
    !['served', 'collected', 'cancelled'].includes(order.status)
  );

  const handleSelectOrder = (orderId: string) => {
    onOpenChange(false);
    navigate(`/orders/${orderId}`);
  };

  const handleNewOrder = () => {
    createOrder('dine-in', table.id);
    onOpenChange(false);
    navigate('/orders/new');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Table {table.tableNumber}
            <Badge variant="secondary">{table.floor}</Badge>
          </DialogTitle>
          <DialogDescription>
            {tableOrders.length > 0 
              ? `${tableOrders.length} active order${tableOrders.length > 1 ? 's' : ''} on this table`
              : 'No active orders on this table'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Active Orders */}
          {tableOrders.length > 0 && (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {tableOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order.id)}
                    className="w-full p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(order.createdAt, { addSuffix: true })}</span>
                          <span>•</span>
                          <span>{order.items.length} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} size="sm" />
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* New Order Button */}
          <Button 
            onClick={handleNewOrder} 
            className="w-full bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}