import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'collected' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway';
export type TableStatus = 'available' | 'occupied';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready';

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime?: number;
  addOns: { id: string; name: string; price: number }[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Table {
  id: string;
  tableNumber: string;
  floor: string;
  capacity: number;
  status: TableStatus;
  currentOrderIds: string[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  addOns: { addOnId: string; name: string; price: number }[];
  status: OrderItemStatus;
  isVeg: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableId?: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  pickupTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  servedAt?: Date;
  createdBy?: string;
}

interface OrderContextType {
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  currentOrder: Partial<Order> | null;
  isLoading: boolean;
  
  // Order operations
  createOrder: (orderType: OrderType, tableId?: string) => void;
  addItemToOrder: (menuItem: MenuItem, quantity: number, notes?: string, addOnIds?: string[]) => void;
  removeItemFromOrder: (itemIndex: number) => void;
  updateItemQuantity: (itemIndex: number, quantity: number) => void;
  submitOrder: (customerName?: string, customerPhone?: string, pickupTime?: Date) => Promise<Order>;
  cancelCurrentOrder: () => void;
  
  // Order status updates
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => Promise<void>;
  
  // Table operations
  updateTableStatus: (tableId: string, status: TableStatus, orderIds?: string[]) => void;
  
  // Filters
  getOrdersByStatus: (statuses: OrderStatus[]) => Order[];
  getOrdersByType: (type: OrderType) => Order[];
  getActiveKitchenOrders: () => Order[];
  
  // Refresh
  refreshData: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Generate order number
function generateOrderNumber(): string {
  const now = new Date();
  const prefix = now.toISOString().slice(2, 10).replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${prefix}-${suffix}`;
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playReadySound } = useNotificationSound();
  const prevReadyCountRef = useRef<number>(0);

  // Fetch all data from database
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // Fetch menu items with addons
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*, menu_item_addons(*)');

      if (menuItemsError) throw menuItemsError;

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');

      if (tablesError) throw tablesError;

      // Fetch orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Transform data
      setCategories(categoriesData?.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        sortOrder: c.sort_order,
        isActive: c.is_active,
      })) || []);

      setMenuItems(menuItemsData?.map(m => ({
        id: m.id,
        categoryId: m.category_id,
        name: m.name,
        description: m.description,
        price: Number(m.price),
        imageUrl: m.image_url,
        isVeg: m.is_veg,
        isAvailable: m.is_available,
        preparationTime: m.preparation_time,
        addOns: m.menu_item_addons?.map((a: any) => ({
          id: a.id,
          name: a.name,
          price: Number(a.price),
        })) || [],
      })) || []);

      // Calculate current order IDs for each table
      const tableOrderMap: Record<string, string[]> = {};
      ordersData?.forEach(order => {
        if (order.table_id && ['new', 'preparing', 'ready'].includes(order.status)) {
          if (!tableOrderMap[order.table_id]) {
            tableOrderMap[order.table_id] = [];
          }
          tableOrderMap[order.table_id].push(order.id);
        }
      });

      setTables(tablesData?.map(t => ({
        id: t.id,
        tableNumber: t.table_number,
        floor: t.floor,
        capacity: t.capacity,
        status: tableOrderMap[t.id]?.length > 0 ? 'occupied' as TableStatus : t.status as TableStatus,
        currentOrderIds: tableOrderMap[t.id] || [],
      })) || []);

      setOrders(ordersData?.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        orderType: o.order_type as OrderType,
        tableId: o.table_id,
        tableNumber: o.table_number,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        totalAmount: Number(o.total_amount),
        status: o.status as OrderStatus,
        createdAt: new Date(o.created_at),
        updatedAt: new Date(o.updated_at),
        createdBy: o.created_by,
        items: o.order_items?.map((item: any) => ({
          id: item.id,
          menuItemId: item.menu_item_id,
          menuItemName: item.menu_item_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
          notes: item.notes,
          addOns: item.addons || [],
          status: item.status as OrderItemStatus,
          isVeg: item.is_veg,
        })) || [],
      })) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const submitOrder = useCallback(async (
    customerName?: string,
    customerPhone?: string,
    pickupTime?: Date
  ): Promise<Order> => {
    if (!currentOrder?.items?.length) {
      throw new Error('No items in order');
    }

    const totalAmount = currentOrder.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderNumber = generateOrderNumber();

    try {
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_type: currentOrder.orderType,
          table_id: currentOrder.tableId,
          table_number: currentOrder.tableNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: totalAmount,
          status: 'new',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = currentOrder.items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menuItemId,
        menu_item_name: item.menuItemName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        status: 'pending' as const,
        notes: item.notes,
        is_veg: item.isVeg,
        addons: item.addOns,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update table status if dine-in
      if (currentOrder.tableId) {
        await supabase
          .from('restaurant_tables')
          .update({ status: 'occupied' })
          .eq('id', currentOrder.tableId);
      }

      const newOrder: Order = {
        id: orderData.id,
        orderNumber: orderData.order_number,
        orderType: orderData.order_type as OrderType,
        tableId: orderData.table_id,
        tableNumber: orderData.table_number,
        customerName: orderData.customer_name,
        customerPhone: orderData.customer_phone,
        items: currentOrder.items,
        totalAmount,
        status: 'new',
        pickupTime,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.updated_at),
      };

      setOrders(prev => [newOrder, ...prev]);
      
      // Update table's order list
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
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  }, [currentOrder]);

  const cancelCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      // Get the order to check if we need to update table
      const order = orders.find(o => o.id === orderId);

      setOrders(prev =>
        prev.map(o => {
          if (o.id !== orderId) return o;
          return { ...o, status, updatedAt: new Date() };
        })
      );

      // Update table status if order is completed
      if ((status === 'served' || status === 'collected') && order?.tableId) {
        const remainingOrders = orders.filter(
          o => o.tableId === order.tableId && o.id !== orderId && ['new', 'preparing', 'ready'].includes(o.status)
        );

        if (remainingOrders.length === 0) {
          await supabase
            .from('restaurant_tables')
            .update({ status: 'available' })
            .eq('id', order.tableId);
        }

        setTables(prev =>
          prev.map(t => {
            if (t.id !== order.tableId) return t;
            const newOrderIds = t.currentOrderIds.filter(id => id !== orderId);
            return { 
              ...t, 
              status: newOrderIds.length > 0 ? 'occupied' : 'available', 
              currentOrderIds: newOrderIds 
            };
          })
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  }, [orders]);

  const updateItemStatus = useCallback(async (orderId: string, itemId: string, status: OrderItemStatus) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ status })
        .eq('id', itemId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order => {
          if (order.id !== orderId) return order;

          const updatedItems = order.items.map(item =>
            item.id === itemId ? { ...item, status } : item
          );

          // Check if all items are ready
          const allReady = updatedItems.every(item => item.status === 'ready');
          const anyPreparing = updatedItems.some(item => item.status === 'preparing');

          let newOrderStatus = order.status;
          if (allReady && order.status !== 'served' && order.status !== 'collected') {
            newOrderStatus = 'ready';
          } else if (anyPreparing && order.status === 'new') {
            newOrderStatus = 'preparing';
          }

          // Update order status in database if changed
          if (newOrderStatus !== order.status) {
            supabase
              .from('orders')
              .update({ status: newOrderStatus, updated_at: new Date().toISOString() })
              .eq('id', orderId);
          }

          return {
            ...order,
            items: updatedItems,
            status: newOrderStatus,
            updatedAt: new Date(),
          };
        })
      );
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    }
  }, []);

  const updateTableStatus = useCallback((
    tableId: string,
    status: TableStatus,
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
        updateTableStatus,
        getOrdersByStatus,
        getOrdersByType,
        getActiveKitchenOrders,
        refreshData: fetchData,
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
