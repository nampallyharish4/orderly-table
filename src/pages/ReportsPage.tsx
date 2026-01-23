import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock,
  Download,
  Calendar,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrders } from '@/contexts/OrderContext';
import { toast } from 'sonner';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

type DateRange = 'today' | 'week' | 'month' | 'year' | 'all';

const dateRangeLabels: Record<DateRange, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  all: 'All Time',
};

export default function ReportsPage() {
  const { orders } = useOrders();
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const getDateRangeStart = (range: DateRange): Date | null => {
    const now = new Date();
    switch (range) {
      case 'today':
        return startOfDay(now);
      case 'week':
        return startOfWeek(now, { weekStartsOn: 1 });
      case 'month':
        return startOfMonth(now);
      case 'year':
        return startOfYear(now);
      case 'all':
        return null;
    }
  };

  const filterByDateRange = (orderDate: Date) => {
    const rangeStart = getDateRangeStart(dateRange);
    if (!rangeStart) return true;
    return isAfter(new Date(orderDate), rangeStart) || new Date(orderDate).getTime() === rangeStart.getTime();
  };

  const filteredOrders = orders.filter(o => filterByDateRange(o.createdAt));
  const completedOrders = filteredOrders.filter(o => o.status === 'served' || o.status === 'collected');
  const pendingOrders = filteredOrders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'ready');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const exportToCSV = () => {
    const headers = ['Order #', 'Date', 'Type', 'Status', 'Items', 'Subtotal', 'Tax', 'Total'];
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
      order.orderType,
      order.status,
      order.items.map(i => `${i.menuItemName} x${i.quantity}`).join('; '),
      order.subtotal.toFixed(2),
      order.taxAmount.toFixed(2),
      order.totalAmount.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kaveri-report-${dateRangeLabels[dateRange].toLowerCase().replace(' ', '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Report exported successfully');
  };

  const stats = [
    {
      title: 'Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      subtitle: dateRangeLabels[dateRange],
      icon: DollarSign,
    },
    {
      title: 'Completed Orders',
      value: completedOrders.length.toString(),
      subtitle: dateRangeLabels[dateRange],
      icon: ShoppingCart,
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.length.toString(),
      subtitle: 'In progress',
      icon: Clock,
    },
    {
      title: 'Avg Order Value',
      value: `₹${avgOrderValue.toFixed(0)}`,
      subtitle: dateRangeLabels[dateRange],
      icon: BarChart3,
    },
  ];

  const getTopItems = () => {
    const itemCounts: Record<string, { name: string; orders: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!itemCounts[item.menuItemId]) {
          itemCounts[item.menuItemId] = { name: item.menuItemName, orders: 0, revenue: 0 };
        }
        itemCounts[item.menuItemId].orders += item.quantity;
        itemCounts[item.menuItemId].revenue += item.totalPrice;
      });
    });
    
    return Object.values(itemCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const topItems = getTopItems();

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-reports">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">View sales and performance analytics</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-date-range">
                <Calendar className="w-4 h-4 mr-2" />
                {dateRangeLabels[dateRange]}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
                <DropdownMenuItem
                  key={range}
                  onClick={() => setDateRange(range)}
                  data-testid={`date-range-${range}`}
                >
                  {dateRangeLabels[range]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportToCSV} data-testid="button-export">
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
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
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
                  {pendingOrders.length}
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
                  {cancelledOrders.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
