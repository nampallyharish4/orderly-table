import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock,
  Download,
  Calendar
} from 'lucide-react';
import { useOrders } from '@/contexts/OrderContext';

export default function ReportsPage() {
  const { orders } = useOrders();

  const completedOrders = orders.filter(o => o.status === 'served' || o.status === 'collected');
  const todayOrders = orders.filter(o => {
    const today = new Date();
    const orderDate = new Date(o.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todayRevenue = todayOrders.filter(o => o.status === 'served' || o.status === 'collected').reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString()}`,
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Total Orders',
      value: completedOrders.length.toString(),
      change: '+5.4%',
      trend: 'up',
      icon: ShoppingCart,
    },
    {
      title: 'Avg Order Value',
      value: `₹${avgOrderValue.toFixed(0)}`,
      change: '-2.1%',
      trend: 'down',
      icon: BarChart3,
    },
  ];

  const topItems = [
    { name: 'Chicken Biryani', orders: 45, revenue: 13500 },
    { name: 'Butter Chicken', orders: 38, revenue: 11400 },
    { name: 'Paneer Butter Masala', orders: 32, revenue: 8000 },
    { name: 'Garlic Naan', orders: 28, revenue: 1680 },
    { name: 'Tandoori Chicken', orders: 25, revenue: 8750 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-reports">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">View sales and performance analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-date-range">
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`top-item-${index}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">₹{item.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Completed Orders</p>
                    <p className="text-xs text-muted-foreground">Successfully delivered</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  {completedOrders.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Orders</p>
                    <p className="text-xs text-muted-foreground">In progress</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                  {orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'ready').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">Cancelled Orders</p>
                    <p className="text-xs text-muted-foreground">Refunded</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                  {orders.filter(o => o.status === 'cancelled').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
