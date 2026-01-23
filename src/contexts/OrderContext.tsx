import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Order, OrderItem, Table, MenuItem, MenuCategory, OrderType, OrderStatus, OrderItemStatus } from '@/types';
import { generateOrderNumber, calculateOrderTotals } from '@/data/mockData';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface OrderContextType {
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  currentOrder: Partial<Order> | null;
  isLoading: boolean;
  
  createOrder: (orderType: OrderType, tableId?: string) => void;
  addItemToOrder: (menuItem: MenuItem, quantity: number, notes?: string, addOnIds?: string[]) => void;
  removeItemFromOrder: (itemIndex: number) => void;
  updateItemQuantity: (itemIndex: number, quantity: number) => void;
  submitOrder: (customerName?: string, customerPhone?: string, pickupTime?: Date) => Promise<Order>;
  cancelCurrentOrder: () => void;
  
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  cancelOrder: (orderId: string) => void;
  
  updateTableStatus: (tableId: string, status: Table['status'], orderIds?: string[]) => void;
  refreshData: () => void;
  
  getOrdersByStatus: (statuses: OrderStatus[]) => Order[];
  getOrdersByType: (type: OrderType) => Order[];
  getActiveKitchenOrders: () => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playReadySound } = useNotificationSound();
  const prevReadyCountRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
      try {
        console.log('Fetching data from API...');
        const [ordersRes, tablesRes, menuRes, categoriesRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/tables'),
          fetch('/api/menu-items'),
          fetch('/api/categories'),
        ]);

        console.log('API responses:', {
          orders: ordersRes.status,
          tables: tablesRes.status,
          menu: menuRes.status,
          categories: categoriesRes.status
        });

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          console.log('Orders loaded:', ordersData.length);
          const parsedOrders = ordersData.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            updatedAt: new Date(o.updatedAt),
            servedAt: o.servedAt ? new Date(o.servedAt) : undefined,
            paidAt: o.paidAt ? new Date(o.paidAt) : undefined,
            pickupTime: o.pickupTime ? new Date(o.pickupTime) : undefined,
          }));
          setOrders(parsedOrders);
        } else {
          console.error('Orders fetch failed:', ordersRes.status);
        }

        if (tablesRes.ok) {
          const tablesData = await tablesRes.json();
          console.log('Tables loaded:', tablesData.length, tablesData);
          setTables(tablesData.map((t: any) => ({
            ...t,
            currentOrderIds: t.currentOrderIds || [],
          })));
        } else {
          console.error('Tables fetch failed:', tablesRes.status);
        }

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          console.log('Menu items loaded:', menuData.length);
          setMenuItems(menuData);
        } else {
          console.error('Menu fetch failed:', menuRes.status);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          console.log('Categories loaded:', categoriesData.length);
          setCategories(categoriesData);
        } else {
          console.error('Categories fetch failed:', categoriesRes.status);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const readyCount = orders.filter(o => o.status === 'ready').length;
    if (readyCount > prevReadyCountRef.current && prevReadyCountRef.current !== 0) {
      playReadySound();
    }
    prevReadyCountRef.current = readyCount;
  }, [orders, playReadySound]);

  useEffect(() => {
    if (isLoading || tables.length === 0) return;
    
    const activeStatuses = ['new', 'preparing', 'ready'];
    
    tables.forEach(table => {
      const activeOrders = orders.filter(
        o => o.tableNumber === table.tableNumber && activeStatuses.includes(o.status)
      );
      
      const shouldBeOccupied = activeOrders.length > 0;
      const isCurrentlyOccupied = table.status === 'occupied';
      
      if (shouldBeOccupied !== isCurrentlyOccupied) {
        const newStatus = shouldBeOccupied ? 'occupied' : 'available';
        const newOrderIds = activeOrders.map(o => o.id);
        
        setTables(prev =>
          prev.map(t =>
            t.id === table.id ? { ...t, status: newStatus, currentOrderIds: newOrderIds } : t
          )
        );
        
        fetch(`/api/tables/${table.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, currentOrderIds: newOrderIds }),
        }).catch(console.error);
      }
    });
  }, [isLoading, orders, tables]);

  const createOrder = useCallback((orderType: OrderType, tableId?: string) => {
    const table = tableId ? tables.find(t => t.id === tableId) : undefined;
    setCurrentOrder({
      orderType,
      tableId,
      tableNumber: table?.tableNumber,
      items: [],
      status: 'new',
    });
  }, [tables]);

  const addItemToOrder = useCallback((
    menuItem: MenuItem,
    quantity: number,
    notes?: string,
    addOnIds?: string[]
  ) => {
    if (!currentOrder) return;

    const selectedAddOns = addOnIds
      ? menuItem.addOns.filter(a => addOnIds.includes(a.id)).map(a => ({
          addOnId: a.id,
          name: a.name,
          price: a.price,
        }))
      : [];

    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const itemTotal = (menuItem.price + addOnsTotal) * quantity;

    const newItem: OrderItem = {
      id: `oi-${Date.now()}`,
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
      totalPrice: itemTotal,
      notes,
      addOns: selectedAddOns,
      status: 'pending',
      isVeg: menuItem.isVeg,
    };

    setCurrentOrder(prev => ({
      ...prev,
      items: [...(prev?.items || []), newItem],
    }));
  }, [currentOrder]);

  const removeItemFromOrder = useCallback((itemIndex: number) => {
    if (!currentOrder?.items) return;
    setCurrentOrder(prev => ({
      ...prev,
      items: prev?.items?.filter((_, i) => i !== itemIndex) || [],
    }));
  }, [currentOrder]);

  const updateItemQuantity = useCallback((itemIndex: number, quantity: number) => {
    if (!currentOrder?.items || quantity < 1) return;
    setCurrentOrder(prev => ({
      ...prev,
      items: prev?.items?.map((item, i) => {
        if (i !== itemIndex) return item;
        const addOnsTotal = item.addOns.reduce((sum, a) => sum + a.price, 0);
        return {
          ...item,
          quantity,
          totalPrice: (item.unitPrice + addOnsTotal) * quantity,
        };
      }) || [],
    }));
  }, [currentOrder]);

  const submitOrder = useCallback(async (
    customerName?: string,
    customerPhone?: string,
    pickupTime?: Date
  ): Promise<Order> => {
    if (!currentOrder?.items?.length) {
      throw new Error('No items in order');
    }

    const totals = calculateOrderTotals(
      currentOrder.items as OrderItem[],
      currentOrder.orderType as OrderType
    );

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      orderType: currentOrder.orderType as OrderType,
      tableId: currentOrder.tableId,
      tableNumber: currentOrder.tableNumber,
      customerName,
      customerPhone,
      items: currentOrder.items as OrderItem[],
      ...totals,
      status: 'new',
      pickupTime,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const savedOrder = await response.json();
      const parsedOrder = {
        ...savedOrder,
        createdAt: new Date(savedOrder.createdAt),
        updatedAt: new Date(savedOrder.updatedAt),
      };

      setOrders(prev => [parsedOrder, ...prev]);

      if (currentOrder.tableId) {
        const table = tables.find(t => t.id === currentOrder.tableId);
        const newOrderIds = [...(table?.currentOrderIds || []), parsedOrder.id];
        
        setTables(prev =>
          prev.map(t =>
            t.id === currentOrder.tableId
              ? { 
                  ...t, 
                  status: 'occupied' as const, 
                  currentOrderIds: newOrderIds 
                }
              : t
          )
        );
        
        await fetch(`/api/tables/${currentOrder.tableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'occupied', currentOrderIds: newOrderIds }),
        });
      }

      setCurrentOrder(null);
      return parsedOrder;
    } catch (error) {
      console.error('Failed to submit order:', error);
      throw error;
    }
  }, [currentOrder, tables]);

  const cancelCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const updates: any = { status };
    
    if (status === 'served' || status === 'collected') {
      updates.servedAt = new Date().toISOString();
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        console.error('Failed to update order status');
        return;
      }

      setOrders(prev =>
        prev.map(order => {
          if (order.id !== orderId) return order;
          
          const orderUpdates: Partial<Order> = {
            status,
            updatedAt: new Date(),
          };

          if (status === 'served' || status === 'collected') {
            orderUpdates.servedAt = new Date();
            if (order.tableNumber) {
              const table = tables.find(t => t.tableNumber === order.tableNumber);
              if (table) {
                const newOrderIds = table.currentOrderIds.filter(id => id !== orderId);
                const newStatus = newOrderIds.length > 0 ? 'occupied' : 'available';
                
                setTables(prevTables =>
                  prevTables.map(t => {
                    if (t.tableNumber !== order.tableNumber) return t;
                    return { 
                      ...t, 
                      status: newStatus as 'available' | 'occupied' | 'reserved', 
                      currentOrderIds: newOrderIds 
                    };
                  })
                );
                
                fetch(`/api/tables/${table.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus, currentOrderIds: newOrderIds }),
                }).catch(console.error);
              }
            }
          }

          return { ...order, ...orderUpdates };
        })
      );
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  }, [tables]);

  const updateItemStatus = useCallback(async (orderId: string, itemId: string, status: OrderItemStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item =>
      item.id === itemId ? { ...item, status } : item
    );

    const allReady = updatedItems.every(item => item.status === 'ready');
    const anyPreparing = updatedItems.some(item => item.status === 'preparing');

    let newOrderStatus = order.status;
    if (allReady && order.status !== 'served' && order.status !== 'collected') {
      newOrderStatus = 'ready';
    } else if (anyPreparing && order.status === 'new') {
      newOrderStatus = 'preparing';
    }

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems, status: newOrderStatus }),
      });

      setOrders(prev =>
        prev.map(o => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            items: updatedItems,
            status: newOrderStatus,
            updatedAt: new Date(),
          };
        })
      );
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  }, [orders]);

  const cancelOrder = useCallback(async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (order.tableNumber) {
        const table = tables.find(t => t.tableNumber === order.tableNumber);
        if (table) {
          const newOrderIds = table.currentOrderIds.filter(id => id !== orderId);
          const newStatus = newOrderIds.length > 0 ? 'occupied' : 'available';
          
          setTables(prev =>
            prev.map(t => {
              if (t.tableNumber !== order.tableNumber) return t;
              return {
                ...t,
                status: newStatus as 'available' | 'occupied' | 'reserved',
                currentOrderIds: newOrderIds,
              };
            })
          );
          
          await fetch(`/api/tables/${table.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, currentOrderIds: newOrderIds }),
          });
        }
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o));
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  }, [orders, tables]);

  const updateTableStatus = useCallback(async (
    tableId: string,
    status: Table['status'],
    orderIds?: string[]
  ) => {
    try {
      const table = tables.find(t => t.id === tableId);
      const newOrderIds = orderIds ?? table?.currentOrderIds ?? [];
      
      await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, currentOrderIds: newOrderIds }),
      });

      setTables(prev =>
        prev.map(t =>
          t.id === tableId ? { ...t, status, currentOrderIds: newOrderIds } : t
        )
      );
    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  }, [tables]);

  const getOrdersByStatus = useCallback((statuses: OrderStatus[]) => {
    return orders.filter(o => statuses.includes(o.status));
  }, [orders]);

  const getOrdersByType = useCallback((type: OrderType) => {
    return orders.filter(o => o.orderType === type);
  }, [orders]);

  const getActiveKitchenOrders = useCallback(() => {
    return orders
      .filter(o => ['new', 'preparing', 'ready'].includes(o.status))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [orders]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        tables,
        menuItems,
        categories,
        currentOrder,
        isLoading,
        createOrder,
        addItemToOrder,
        removeItemFromOrder,
        updateItemQuantity,
        submitOrder,
        cancelCurrentOrder,
        updateOrderStatus,
        updateItemStatus,
        cancelOrder,
        updateTableStatus,
        refreshData: fetchData,
        getOrdersByStatus,
        getOrdersByType,
        getActiveKitchenOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
