import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order, OrderItem, OrderItemStatus } from '@/types';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Timer,
  Package,
  Utensils,
  Leaf,
  CircleDot,
  Volume2,
  VolumeX,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';

export default function KitchenPage() {
  const { orders, updateItemStatus, updateOrderStatus, startPreparingOrder, isLoading } = useOrders();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { playReadySound } = useNotificationSound();

  // Get active kitchen orders
  const kitchenOrders = orders
    .filter(o => ['new', 'preparing', 'ready'].includes(o.status))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const newOrders = kitchenOrders.filter(o => o.status === 'new');
  const preparingOrders = kitchenOrders.filter(o => o.status === 'preparing');
  const readyOrders = kitchenOrders.filter(o => o.status === 'ready');

  const getOrderPriority = (order: Order): 'normal' | 'rush' | 'overdue' => {
    const minutes = differenceInMinutes(new Date(), order.createdAt);
    if (minutes > 20) return 'overdue';
    if (minutes > 15) return 'rush';
    return 'normal';
  };

  const handleStartPreparing = async (order: Order) => {
    setUpdatingOrderId(order.id);
    try {
      await startPreparingOrder(order.id);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleItemReady = async (orderId: string, itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      await updateItemStatus(orderId, itemId, 'ready');
      if (soundEnabled) {
        playReadySound();
      }
    } finally {
      setUpdatingItemId(null);
    }
  };


  const KitchenOrderCard = ({ order }: { order: Order }) => {
    const priority = getOrderPriority(order);
    const minutesAgo = differenceInMinutes(new Date(), order.createdAt);
    const isTakeaway = order.orderType === 'takeaway';
    const isReady = order.status === 'ready';
    const pendingItems = order.items.filter(i => i.status !== 'ready');
    const readyItems = order.items.filter(i => i.status === 'ready');

    return (
      <Card className={`
        ${priority === 'overdue' ? 'border-destructive bg-destructive/5 animate-pulse-subtle' : ''}
        ${priority === 'rush' ? 'border-warning bg-warning/5' : ''}
        ${isReady ? 'border-success bg-success/5 order-card-ready' : ''}
      `}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl
                ${isTakeaway ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}
              `}>
                {isTakeaway ? <Package className="w-7 h-7" /> : order.tableNumber}
              </div>
              <div>
                <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <StatusBadge status={order.status} size="sm" />
                  {isTakeaway && order.customerName && (
                    <span className="text-muted-foreground">{order.customerName}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-1 text-sm ${
              priority === 'overdue' ? 'text-destructive' :
              priority === 'rush' ? 'text-warning' :
              'text-muted-foreground'
            }`}>
              {priority === 'overdue' ? <AlertCircle className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
              {minutesAgo} min
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Order Items */}
          <div className="space-y-2">
            {order.items.map(item => (
              <div 
                key={item.id} 
                className={`
                  flex items-center justify-between p-3 rounded-lg border
                  ${item.status === 'ready' ? 'bg-success/10 border-success/30' : 
                    item.status === 'preparing' ? 'bg-warning/10 border-warning/30' : 
                    'bg-secondary border-border'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-background flex items-center justify-center font-bold text-lg">
                    {item.quantity}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      {item.isVeg ? (
                        <Leaf className="w-4 h-4 text-success" />
                      ) : (
                        <CircleDot className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-medium">{item.menuItemName}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-warning mt-1">📝 {item.notes}</p>
                    )}
                    {item.addOns.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        + {item.addOns.map(a => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {item.status !== 'ready' && (
                  <Button
                    size="sm"
                    variant={item.status === 'preparing' ? 'default' : 'outline'}
                    onClick={() => handleItemReady(order.id, item.id)}
                    disabled={updatingItemId === item.id}
                    className={item.status === 'preparing' ? 'bg-success hover:bg-success/90' : ''}
                  >
                    {updatingItemId === item.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    )}
                    {item.status === 'preparing' ? 'Done' : 'Start'}
                  </Button>
                )}
                {item.status === 'ready' && (
                  <Badge variant="outline" className="border-success text-success">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {order.status === 'new' && (
              <Button 
                className="flex-1 bg-gradient-primary hover:opacity-90"
                onClick={() => handleStartPreparing(order)}
                disabled={updatingOrderId === order.id}
              >
                {updatingOrderId === order.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ChefHat className="w-4 h-4 mr-2" />
                )}
                {updatingOrderId === order.id ? 'Starting...' : 'Start Preparing'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="kitchen-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading kitchen orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 sm:w-7 h-6 sm:h-7 text-primary shrink-0" />
            <span className="truncate">Kitchen Display</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {kitchenOrders.length} active order{kitchenOrders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="shrink-0"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-status-new/50 bg-status-new/5">
          <CardContent className="py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">New</p>
              <p className="text-2xl sm:text-3xl font-bold text-status-new">{newOrders.length}</p>
            </div>
            <Clock className="w-6 sm:w-8 h-6 sm:h-8 text-status-new opacity-50 hidden sm:block" />
          </CardContent>
        </Card>
        <Card className="border-status-preparing/50 bg-status-preparing/5">
          <CardContent className="py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Preparing</p>
              <p className="text-2xl sm:text-3xl font-bold text-status-preparing">{preparingOrders.length}</p>
            </div>
            <ChefHat className="w-6 sm:w-8 h-6 sm:h-8 text-status-preparing opacity-50 hidden sm:block" />
          </CardContent>
        </Card>
        <Card className="border-status-ready/50 bg-status-ready/5">
          <CardContent className="py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Ready</p>
              <p className="text-2xl sm:text-3xl font-bold text-status-ready">{readyOrders.length}</p>
            </div>
            <CheckCircle2 className="w-6 sm:w-8 h-6 sm:h-8 text-status-ready opacity-50 hidden sm:block" />
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      {kitchenOrders.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">No orders waiting in the kitchen</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4 w-full sm:w-auto flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="all" className="text-xs sm:text-sm flex-1 sm:flex-none">All ({kitchenOrders.length})</TabsTrigger>
            <TabsTrigger value="new" className="text-xs sm:text-sm flex-1 sm:flex-none">New ({newOrders.length})</TabsTrigger>
            <TabsTrigger value="preparing" className="text-xs sm:text-sm flex-1 sm:flex-none">Prep ({preparingOrders.length})</TabsTrigger>
            <TabsTrigger value="ready" className="text-xs sm:text-sm flex-1 sm:flex-none">Ready ({readyOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {kitchenOrders.map(order => (
                <KitchenOrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {newOrders.map(order => (
                <KitchenOrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preparing">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {preparingOrders.map(order => (
                <KitchenOrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ready">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {readyOrders.map(order => (
                <KitchenOrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
