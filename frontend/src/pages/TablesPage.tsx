import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { useOrders } from '@/contexts/OrderContext';
import { useNavigate } from 'react-router-dom';
import { TableCard } from '@/components/tables/TableCard';
import { TableOrdersDialog } from '@/components/tables/TableOrdersDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableStatus } from '@/types';
import { LayoutGrid, List, Loader2, Utensils, CheckCircle2, Settings, Save, Edit3 } from 'lucide-react';
import { Rnd } from 'react-rnd';

export default function TablesPage() {
  const { tables, orders, createOrder, isLoading } = useOrders();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Layout Canvas Customization State
  const [isEditMode, setIsEditMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 800 });

  const defaultTablePositions: Record<string, { top: string, left: string, width: string, height: string }> = {
    'T2': { top: '2%', left: '2%', width: '46%', height: '22%' },
    'T3': { top: '24%', left: '2%', width: '46%', height: '22%' },
    'T1': { top: '2%', left: '52%', width: '46%', height: '22%' },
    'T4': { top: '24%', left: '75%', width: '23%', height: '19%' },
    'T5': { top: '43%', left: '75%', width: '23%', height: '19%' },
    'F1': { top: '62%', left: '13.5%', width: '23%', height: '19%' },
    'F2': { top: '81%', left: '13.5%', width: '23%', height: '19%' },
    'T6': { top: '62%', left: '52%', width: '23%', height: '19%' },
    'T7': { top: '62%', left: '75%', width: '23%', height: '19%' },
    'T8': { top: '81%', left: '52%', width: '23%', height: '19%' },
    'T9': { top: '81%', left: '75%', width: '23%', height: '19%' },
  };

  const [tablePositions, setTablePositions] = useState<Record<string, { top: string, left: string, width: string, height: string }>>(() => {
    const saved = localStorage.getItem('orderly_table_layout');
    if (saved) return JSON.parse(saved);
    return defaultTablePositions;
  });

  // Track container pixel dimensions for react-rnd math
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    
    // Fetch remote settings to sync layout
    fetch(`${API_BASE_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.tableLayout && Object.keys(data.tableLayout).length > 0) {
          setTablePositions(data.tableLayout);
          localStorage.setItem('orderly_table_layout', JSON.stringify(data.tableLayout));
        }
      })
      .catch(err => console.error('Failed to sync layout from server:', err));

    return () => observer.disconnect();
  }, [viewMode]);

  const toggleEditMode = async () => {
    if (isEditMode) {
      setIsSaving(true);
      // Save locally as backup
      localStorage.setItem('orderly_table_layout', JSON.stringify(tablePositions));
      
      // Save to server (Supabase database)
      try {
        await fetch(`${API_BASE_URL}/api/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableLayout: tablePositions })
        });
      } catch (err) {
        console.error('Failed to save layout to server:', err);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditMode(!isEditMode);
  };

  // Map a table to its logical section
  const getTableSection = (t: Table) => {
    const floor = (t.floor || '').toLowerCase();
    const num = (t.tableNumber || '').toUpperCase();
    if (floor.includes('large') || (num.startsWith('T') && t.capacity >= 6) || t.capacity >= 6) {
      return 'Large Tables';
    } else if (floor.includes('family') || num.startsWith('F') || (t.capacity === 4 && floor.includes('family'))) {
      return 'Family Section';
    } else {
      return 'Small Tables';
    }
  };

  // Get unique sections available
  const floors = ['Large Tables', 'Family Section', 'Small Tables'];

  // Filter tables based on section and status
  const filteredTables = tables.filter(t => {
    const section = getTableSection(t);
    if (floorFilter !== 'all' && section !== floorFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  // Group by section for grid view
  const tablesBySection = floors.reduce((acc, section) => {
    acc[section] = filteredTables.filter(t => getTableSection(t) === section);
    return acc;
  }, {} as Record<string, Table[]>);

  const handleTableClick = (table: Table) => {
    if (isEditMode) return; // Disable clicks opening dialogs during edit mode
    
    if (table.status === 'occupied' && table.currentOrderIds.length > 0) {
      // Show dialog to select order or create new one
      setSelectedTable(table);
      setDialogOpen(true);
    } else {
      // Create new order directly for available table
      createOrder('dine-in', table.id);
      navigate('/orders/new');
    }
  };

  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
  };

  if (isLoading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading tables...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">Table Management</h1>
          <p className="text-muted-foreground mt-1">
            Select an available table to start a new order
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="stat-card-success border overflow-hidden group hover:shadow-lg transition-shadow duration-300">
          <CardContent className="py-3 sm:py-4 relative">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-success flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.available}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card-primary border overflow-hidden group hover:shadow-lg transition-shadow duration-300">
          <CardContent className="py-3 sm:py-4 relative">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-400">{stats.occupied}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0 font-medium">Floor:</span>
          <div className="flex gap-1">
            <Button
              variant={floorFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFloorFilter('all')}
              className={`text-xs sm:text-sm ${floorFilter === 'all' ? 'bg-gradient-primary border-0 shadow-md' : ''}`}
            >
              All
            </Button>
            {floors.map(floor => (
              <Button
                key={floor}
                variant={floorFilter === floor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFloorFilter(floor)}
                className={`text-xs sm:text-sm whitespace-nowrap ${floorFilter === floor ? 'bg-gradient-primary border-0 shadow-md' : ''}`}
              >
                {floor}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0 font-medium">Status:</span>
          <div className="flex gap-1">
            {(['all', 'available', 'occupied'] as const).map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`capitalize text-xs sm:text-sm ${statusFilter === status ? 'bg-gradient-primary border-0 shadow-md' : ''}`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex gap-1 bg-secondary/50 rounded-lg p-0.5 items-center">
          {viewMode === 'grid' && (
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleEditMode}
              disabled={isSaving}
              className={`mr-2 h-8 text-xs ${isEditMode ? 'bg-amber-500 hover:bg-amber-600 border-0 shadow-md' : 'border-border/50'}`}
            >
              {isEditMode ? (isSaving ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...</> : <><Save className="w-3.5 h-3.5 mr-1" /> Save Canvas</>) : <><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Layout</>}
            </Button>
          )}
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={`h-8 w-8 ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={`h-8 w-8 ${viewMode === 'list' ? 'shadow-sm' : ''}`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tables Grid / Floor Plan */}
      {viewMode === 'grid' ? (
        <div ref={containerRef} className={`w-full relative aspect-[4/5] sm:aspect-square lg:aspect-[4/3] max-w-6xl mx-auto rounded-3xl border ${isEditMode ? 'border-amber-500/50 bg-black/20' : 'border-white/5 bg-black/10'} shadow-2xl transition-colors`}>
          {isEditMode && (
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                <LayoutGrid className="w-64 h-64" />
             </div>
          )}
          {filteredTables.filter(t => !(t as any).hidden).map(table => {
            const tableOrders = orders.filter(o => table.currentOrderIds.includes(o.id));
            const firstOrder = tableOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
            
            const position = tablePositions[table.tableNumber] || { top: '10%', left: '10%', width: '17%', height: '16%' };
            
            // Map percentage values into current physical container pixels for react-rnd (only used in edit mode)
            const pxX = (parseFloat(position.left) / 100) * containerSize.w || 0;
            const pxY = (parseFloat(position.top) / 100) * containerSize.h || 0;
            const pxW = (parseFloat(position.width) / 100) * containerSize.w || 0;
            const pxH = (parseFloat(position.height) / 100) * containerSize.h || 0;

            if (!isEditMode) {
              return (
                <div 
                  key={table.id} 
                  className="absolute transition-all duration-300 ease-in-out cursor-pointer hover:scale-[1.02]"
                  style={{ top: position.top, left: position.left, width: position.width, height: position.height }}
                >
                  <TableCard
                    table={table}
                    onClick={() => handleTableClick(table)}
                    creatorName={firstOrder?.createdBy}
                  />
                </div>
              );
            }

            return (
              <Rnd
                key={table.id}
                bounds="parent"
                position={{ x: pxX, y: pxY }}
                size={{ width: pxW, height: pxH }}
                disableDragging={false}
                enableResizing={true}
                onDragStop={(e, d) => {
                  setTablePositions(prev => ({
                    ...prev,
                    [table.tableNumber]: {
                      ...prev[table.tableNumber],
                      left: `${(d.x / containerSize.w) * 100}%`,
                      top: `${(d.y / containerSize.h) * 100}%`
                    }
                  }));
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setTablePositions(prev => ({
                    ...prev,
                    [table.tableNumber]: {
                      left: `${(position.x / containerSize.w) * 100}%`,
                      top: `${(position.y / containerSize.h) * 100}%`,
                      width: `${(ref.offsetWidth / containerSize.w) * 100}%`,
                      height: `${(ref.offsetHeight / containerSize.h) * 100}%`
                    }
                  }));
                }}
                className={'absolute z-50 cursor-move ring-2 ring-amber-500/50 rounded-lg hover:ring-amber-500 bg-amber-500/10'}
              >
                <TableCard
                  table={table}
                  onClick={() => handleTableClick(table)}
                  creatorName={firstOrder?.createdBy}
                />
              </Rnd>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTables.map(table => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className="w-full p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all duration-200 flex items-center justify-between group hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform duration-200 group-hover:scale-110 ${
                  table.status === 'available' 
                    ? 'bg-gradient-success text-white shadow-md' 
                    : 'bg-gradient-primary text-white shadow-md'
                }`}>
                  {table.tableNumber}
                </div>
                <div className="text-left">
                  <p className="font-medium">{table.floor} Floor</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Capacity: {table.capacity}</p>
                    {table.status === 'occupied' && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        {(() => {
                           const tableOrders = orders.filter(o => table.currentOrderIds.includes(o.id));
                           const firstOrder = tableOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
                           return firstOrder ? (
                             <p className="text-xs font-medium text-amber-400">By: {firstOrder.createdBy}</p>
                           ) : null;
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={`capitalize ${
                table.status === 'available' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                'border-amber-500/50 text-amber-400 bg-amber-500/10'
              }`}>
                {table.status}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {filteredTables.length === 0 && (
        <Card className="border-dashed border-muted-foreground/20">
          <CardContent className="py-12 text-center text-muted-foreground">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No tables match your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Table Orders Dialog */}
      <TableOrdersDialog 
        table={selectedTable} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
}
