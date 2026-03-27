import { useCallback, useMemo, useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useNavigate } from 'react-router-dom';
import { OrderCard } from '@/components/orders/OrderCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types';
import { Plus, Search, Package, Utensils, Filter, Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const { orders, createOrder, isLoading } = useOrders();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dine-in' | 'takeaway'>(
    'all',
  );

  // Filter orders
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (statusFilter !== 'all' && order.status !== statusFilter)
          return false;
        if (typeFilter !== 'all' && order.orderType !== typeFilter)
          return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            order.orderNumber.toLowerCase().includes(query) ||
            order.tableNumber?.toLowerCase().includes(query) ||
            order.customerName?.toLowerCase().includes(query)
          );
        }
        return true;
      }),
    [orders, searchQuery, statusFilter, typeFilter],
  );

  const activeOrders = useMemo(
    () =>
      filteredOrders.filter((o) =>
        ['new', 'preparing', 'ready', 'served'].includes(o.status),
      ),
    [filteredOrders],
  );
  const completedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'collected'),
    [filteredOrders],
  );
  const cancelledOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'cancelled'),
    [filteredOrders],
  );

  const handleNewTakeaway = useCallback(() => {
    createOrder('takeaway');
    navigate('/orders/new');
  }, [createOrder, navigate]);

  const statusCounts = useMemo(
    () => ({
      new: orders.filter((o) => o.status === 'new').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      served: orders.filter((o) => o.status === 'served').length,
    }),
    [orders],
  );

  if (isLoading && orders.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-testid="orders-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage dine-in and takeaway orders
          </p>
        </div>
        <Button
          onClick={handleNewTakeaway}
          className="bg-gradient-primary hover:opacity-90"
          data-testid="button-new-takeaway"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Takeaway Order
        </Button>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card
          className="cursor-pointer hover:border-status-new/50 transition-colors"
          onClick={() => setStatusFilter('new')}
        >
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-status-new">
                  {statusCounts.new}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">New</p>
              </div>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-status-new/10 hidden sm:flex items-center justify-center">
                <Package className="w-4 sm:w-5 h-4 sm:h-5 text-status-new" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-status-preparing/50 transition-colors"
          onClick={() => setStatusFilter('preparing')}
        >
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-status-preparing">
                  {statusCounts.preparing}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Preparing
                </p>
              </div>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-status-preparing/10 hidden sm:flex items-center justify-center">
                <Package className="w-4 sm:w-5 h-4 sm:h-5 text-status-preparing" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-status-ready/50 transition-colors"
          onClick={() => setStatusFilter('ready')}
        >
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-status-ready">
                  {statusCounts.ready}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ready
                </p>
              </div>
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-status-ready/10 hidden sm:flex items-center justify-center">
                <Package className="w-4 sm:w-5 h-4 sm:h-5 text-status-ready" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-orders"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
            Type:
          </span>
          <div className="flex gap-1">
            {(['all', 'dine-in', 'takeaway'] as const).map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type)}
                className="capitalize text-xs sm:text-sm whitespace-nowrap"
              >
                {type === 'all' ? (
                  'All'
                ) : type === 'dine-in' ? (
                  <>
                    <Utensils className="w-3 h-3 mr-1" />{' '}
                    <span className="hidden xs:inline">Dine-In</span>
                    <span className="xs:hidden">Dine</span>
                  </>
                ) : (
                  <>
                    <Package className="w-3 h-3 mr-1" />{' '}
                    <span className="hidden xs:inline">Takeaway</span>
                    <span className="xs:hidden">Take</span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>

        {statusFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="self-start sm:self-auto"
          >
            Clear filter
          </Button>
        )}
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex">
          <TabsTrigger
            value="active"
            className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
            data-testid="tab-active"
          >
            Active
            <Badge variant="secondary" className="text-xs">
              {activeOrders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
            data-testid="tab-completed"
          >
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Done</span>
            <Badge variant="secondary" className="text-xs">
              {completedOrders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
            data-testid="tab-cancelled"
          >
            <span className="hidden sm:inline">Cancelled</span>
            <span className="sm:hidden">Cancel</span>
            <Badge variant="secondary" className="text-xs">
              {cancelledOrders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showItems
                  onClick={() => navigate(`/orders/${order.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No completed orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} compact />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No cancelled orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {cancelledOrders.map((order) => (
                <OrderCard key={order.id} order={order} compact />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
