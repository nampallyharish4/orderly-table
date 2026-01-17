import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useNavigate } from 'react-router-dom';
import { TableCard } from '@/components/tables/TableCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableStatus } from '@/types';
import { Plus, Filter, LayoutGrid, List } from 'lucide-react';

export default function TablesPage() {
  const { tables, createOrder } = useOrders();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');

  // Get unique floors
  const floors = Array.from(new Set(tables.map(t => t.floor)));

  // Filter tables
  const filteredTables = tables.filter(t => {
    if (floorFilter !== 'all' && t.floor !== floorFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  // Group by floor for grid view
  const tablesByFloor = floors.reduce((acc, floor) => {
    acc[floor] = filteredTables.filter(t => t.floor === floor);
    return acc;
  }, {} as Record<string, Table[]>);

  const handleTableClick = (table: Table) => {
    if (table.status === 'available') {
      createOrder('dine-in', table.id);
      navigate('/orders/new');
    } else if (table.status === 'occupied' && table.currentOrderId) {
      navigate(`/orders/${table.currentOrderId}`);
    }
  };

  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Table Management</h1>
          <p className="text-muted-foreground">
            Select an available table to start a new order
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="table-available">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-table-available">{stats.available}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="table-occupied">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-table-occupied">{stats.occupied}</p>
            <p className="text-sm text-muted-foreground">Occupied</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Floor:</span>
          <div className="flex gap-1">
            <Button
              variant={floorFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFloorFilter('all')}
            >
              All
            </Button>
            {floors.map(floor => (
              <Button
                key={floor}
                variant={floorFilter === floor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFloorFilter(floor)}
              >
                {floor}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex gap-1">
            {(['all', 'available', 'occupied'] as const).map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tables Grid */}
      {viewMode === 'grid' ? (
        <div className="space-y-8">
          {Object.entries(tablesByFloor).map(([floor, floorTables]) => (
            floorTables.length > 0 && (
              <div key={floor}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {floor} Floor
                  <Badge variant="secondary">{floorTables.length} tables</Badge>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {floorTables.map(table => (
                    <TableCard
                      key={table.id}
                      table={table}
                      onClick={() => handleTableClick(table)}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTables.map(table => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className="w-full p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                  table.status === 'available' ? 'bg-table-available/20 text-table-available' :
                  'bg-table-occupied/20 text-table-occupied'
                }`}>
                  {table.tableNumber}
                </div>
                <div className="text-left">
                  <p className="font-medium">{table.floor} Floor</p>
                  <p className="text-sm text-muted-foreground">Capacity: {table.capacity}</p>
                </div>
              </div>
              <Badge variant="outline" className={`capitalize ${
                table.status === 'available' ? 'border-table-available text-table-available' :
                'border-table-occupied text-table-occupied'
              }`}>
                {table.status}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {filteredTables.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No tables match your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
