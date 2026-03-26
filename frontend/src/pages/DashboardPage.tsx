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
  Sparkles,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { orders, tables, getActiveKitchenOrders, isLoading } = useOrders();

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

  if (isLoading && orders.length === 0 && tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            <span className="text-gradient-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.name} 👋
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none hover:border-emerald-500/50 hover:text-emerald-400 transition-colors" data-testid="button-new-dinein">
            <Link to="/tables">
              <Utensils className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New </span>Dine-In
            </Link>
          </Button>
          <Button asChild className="bg-gradient-primary hover:opacity-90 flex-1 sm:flex-none shadow-lg shadow-primary/20" size="sm" data-testid="button-new-takeaway">
            <Link to="/orders">
              <Package className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New </span>Takeaway
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="stat-card-primary border group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Today's Revenue</p>
                <p className="text-xl sm:text-2xl font-bold font-mono-price text-amber-400">
                  ₹{todayRevenue.toFixed(0)}
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                <IndianRupee className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card-info border group hover:shadow-lg hover:shadow-info/5 transition-all duration-300 overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-sky-400">{activeOrders.length}</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-info flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
              <span className="text-[10px] sm:text-xs status-new px-1.5 sm:px-2 py-0.5 rounded-full border">
                {newOrders.length} new
              </span>
              <span className="text-[10px] sm:text-xs status-preparing px-1.5 sm:px-2 py-0.5 rounded-full border">
                {preparingOrders.length} prep
              </span>
              <span className="text-[10px] sm:text-xs status-ready px-1.5 sm:px-2 py-0.5 rounded-full border">
                {readyOrders.length} ready
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card-success border group hover:shadow-lg hover:shadow-success/5 transition-all duration-300 overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Tables</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {occupiedTables}/{tables.length}
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-success flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-400/70 mt-2 sm:mt-3 font-medium">
              {availableTables} available
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card-purple border group hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">{todayOrders.length}</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-purple flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {dineInCount} dine-in
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {takeawayCount} take
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-primary" />
              Active Orders
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm text-primary hover:text-primary">
              <Link to="/orders">
                View All <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4 ml-1" />
              </Link>
            </Button>
          </div>
          
          {recentOrders.length === 0 ? (
            <Card className="border-dashed border-muted-foreground/20">
              <CardContent className="py-8 sm:py-12 text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-sm sm:text-base font-medium">No active orders right now</p>
                <p className="text-xs text-muted-foreground/70 mt-1">All caught up! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentOrders.map(order => (
                <OrderCard key={order.id} order={order} compact />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-accent" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
            <Button asChild variant="outline" className="w-full justify-start h-12 sm:h-14 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 group">
              <Link to="/tables">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-gradient-success flex items-center justify-center mr-2 sm:mr-3 shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <Utensils className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">Tables</p>
                  <p className="text-[10px] sm:text-xs text-emerald-400/70 truncate">{availableTables} available</p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start h-12 sm:h-14 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 group">
              <Link to="/kitchen">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-gradient-primary flex items-center justify-center mr-2 sm:mr-3 shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <ChefHat className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">Kitchen</p>
                  <p className="text-[10px] sm:text-xs text-amber-400/70 truncate">{preparingOrders.length} preparing</p>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start h-12 sm:h-14 col-span-2 lg:col-span-1 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-200 group">
              <Link to="/orders">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-gradient-purple flex items-center justify-center mr-2 sm:mr-3 shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <Package className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">Takeaway</p>
                  <p className="text-[10px] sm:text-xs text-purple-400/70 truncate">Quick order creation</p>
                </div>
              </Link>
            </Button>
          </div>

          {/* Ready Orders Alert */}
          {readyOrders.length > 0 && (
            <Card className="border-emerald-500/40 bg-emerald-500/5 overflow-hidden">
              <CardContent className="py-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 pointer-events-none" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-success flex items-center justify-center animate-pulse-subtle shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-400">
                      {readyOrders.length} Order{readyOrders.length > 1 ? 's' : ''} Ready!
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
