import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { OrderCard } from '@/components/orders/OrderCard';
import { Link } from 'react-router-dom';
import {
  Utensils,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChefHat,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { orders, tables, getActiveKitchenOrders } = useOrders();

  // Stats
  const todayOrders = orders.filter(o => {
    const today = new Date();
    return o.createdAt.toDateString() === today.toDateString();
  });
  
  const activeOrders = orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status));
  const newOrders = orders.filter(o => o.status === 'new');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const availableTables = tables.filter(t => t.status === 'available').length;
  
  const todayRevenue = todayOrders
    .filter(o => o.status === 'served' || o.status === 'collected')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const dineInCount = todayOrders.filter(o => o.orderType === 'dine-in').length;
  const takeawayCount = todayOrders.filter(o => o.orderType === 'takeaway').length;

  const recentOrders = activeOrders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end gap-4">
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/tables">
              <Utensils className="w-4 h-4 mr-2" />
              New Dine-In
            </Link>
          </Button>
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/orders">
              <Package className="w-4 h-4 mr-2" />
              New Takeaway
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold font-mono-price text-primary">
                  ₹{todayRevenue.toFixed(0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{activeOrders.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-info" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="text-xs status-new px-2 py-0.5 rounded-full border">
                {newOrders.length} new
              </span>
              <span className="text-xs status-preparing px-2 py-0.5 rounded-full border">
                {preparingOrders.length} prep
              </span>
              <span className="text-xs status-ready px-2 py-0.5 rounded-full border">
                {readyOrders.length} ready
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tables</p>
                <p className="text-2xl font-bold">
                  {occupiedTables}/{tables.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {availableTables} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold">{todayOrders.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
            <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
              <span>{dineInCount} dine-in</span>
              <span>•</span>
              <span>{takeawayCount} takeaway</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Orders</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          
          {recentOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active orders right now</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <OrderCard key={order.id} order={order} compact />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          
          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start h-14">
              <Link to="/tables">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <Utensils className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Manage Tables</p>
                  <p className="text-xs text-muted-foreground">{availableTables} tables available</p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start h-14">
              <Link to="/kitchen">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mr-3">
                  <ChefHat className="w-5 h-5 text-warning" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Kitchen Display</p>
                  <p className="text-xs text-muted-foreground">{preparingOrders.length} orders preparing</p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start h-14">
              <Link to="/orders">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mr-3">
                  <Package className="w-5 h-5 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Takeaway Orders</p>
                  <p className="text-xs text-muted-foreground">Quick order creation</p>
                </div>
              </Link>
            </Button>
          </div>

          {/* Ready Orders Alert */}
          {readyOrders.length > 0 && (
            <Card className="border-success/50 bg-success/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center animate-pulse-subtle">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-success">
                      {readyOrders.length} Order{readyOrders.length > 1 ? 's' : ''} Ready
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ready for serving/pickup
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
