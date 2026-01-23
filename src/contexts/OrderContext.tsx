import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Order, OrderItem, Table, MenuItem, OrderType, OrderStatus, OrderItemStatus } from '@/types';
import { mockOrders, mockTables, mockMenuItems, generateOrderNumber, calculateOrderTotals } from '@/data/mockData';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface OrderContextType {
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  currentOrder: Partial<Order> | null;
  
  // Order operations
  createOrder: (orderType: OrderType, tableId?: string) => void;
  addItemToOrder: (menuItem: MenuItem, quantity: number, notes?: string, addOnIds?: string[]) => void;
  removeItemFromOrder: (itemIndex: number) => void;
  updateItemQuantity: (itemIndex: number, quantity: number) => void;
  submitOrder: (customerName?: string, customerPhone?: string, pickupTime?: Date) => Order;
  cancelCurrentOrder: () => void;
  
  // Order status updates
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  deleteOrder: (orderId: string) => void;
  
  // Table operations
  updateTableStatus: (tableId: string, status: Table['status'], orderIds?: string[]) => void;
  
  // Filters
  getOrdersByStatus: (statuses: OrderStatus[]) => Order[];
  getOrdersByType: (type: OrderType) => Order[];
  getActiveKitchenOrders: () => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [menuItems] = useState<MenuItem[]>(mockMenuItems);
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  const { playReadySound } = useNotificationSound();
  const prevReadyCountRef = useRef<number>(0);

  // Track ready orders and play sound when count increases
  useEffect(() => {
    const readyCount = orders.filter(o => o.status === 'ready').length;
    if (readyCount > prevReadyCountRef.current && prevReadyCountRef.current !== 0) {
      playReadySound();
    }
    prevReadyCountRef.current = readyCount;
  }, [orders, playReadySound]);

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

  const submitOrder = useCallback((
    customerName?: string,
    customerPhone?: string,
    pickupTime?: Date
  ): Order => {
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
      createdBy: 'current-user', // Would come from auth context
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update table status if dine-in - add order to table's order list
    if (currentOrder.tableId) {
      setTables(prev =>
        prev.map(t =>
          t.id === currentOrder.tableId
            ? { 
                ...t, 
                status: 'occupied' as const, 
                currentOrderIds: [...t.currentOrderIds, newOrder.id] 
              }
            : t
        )
      );
    }

    setCurrentOrder(null);
    return newOrder;
  }, [currentOrder]);

  const cancelCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;
        
        const updates: Partial<Order> = {
          status,
          updatedAt: new Date(),
        };

        if (status === 'served' || status === 'collected') {
          updates.servedAt = new Date();
          // Remove order from table's list
          if (order.tableId) {
            setTables(tables =>
              tables.map(t => {
                if (t.id !== order.tableId) return t;
                const newOrderIds = t.currentOrderIds.filter(id => id !== orderId);
                return { 
                  ...t, 
                  status: newOrderIds.length > 0 ? 'occupied' as const : 'available' as const, 
                  currentOrderIds: newOrderIds 
                };
              })
            );
          }
        }

        return { ...order, ...updates };
      })
    );
  }, []);

  const updateItemStatus = useCallback((orderId: string, itemId: string, status: OrderItemStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;

        const updatedItems = order.items.map(item =>
          item.id === itemId ? { ...item, status } : item
        );

        // Check if all items are ready -> update order status
        const allReady = updatedItems.every(item => item.status === 'ready');
        const anyPreparing = updatedItems.some(item => item.status === 'preparing');

        let newOrderStatus = order.status;
        if (allReady && order.status !== 'served' && order.status !== 'collected') {
          newOrderStatus = 'ready';
        } else if (anyPreparing && order.status === 'new') {
          newOrderStatus = 'preparing';
        }

        return {
          ...order,
          items: updatedItems,
          status: newOrderStatus,
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // If order has a table, release the table
    if (order.tableId) {
      setTables(prev =>
        prev.map(t => {
          if (t.id !== order.tableId) return t;
          const newOrderIds = t.currentOrderIds.filter(id => id !== orderId);
          return {
            ...t,
            status: newOrderIds.length > 0 ? 'occupied' as const : 'available' as const,
            currentOrderIds: newOrderIds,
          };
        })
      );
    }

    // Remove the order from the list
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, [orders]);

  const updateTableStatus = useCallback((
    tableId: string,
    status: Table['status'],
    orderIds?: string[]
  ) => {
    setTables(prev =>
      prev.map(t =>
        t.id === tableId ? { ...t, status, currentOrderIds: orderIds ?? t.currentOrderIds } : t
      )
    );
  }, []);

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
        currentOrder,
        createOrder,
        addItemToOrder,
        removeItemFromOrder,
        updateItemQuantity,
        submitOrder,
        cancelCurrentOrder,
        updateOrderStatus,
        updateItemStatus,
        deleteOrder,
        updateTableStatus,
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
