import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import {
  Order,
  OrderItem,
  Table,
  TableStatus,
  MenuItem,
  MenuCategory,
  OrderType,
  OrderStatus,
  OrderItemStatus,
} from '@/types';
import { generateOrderNumber, calculateOrderTotals } from '@/data/mockData';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useAuth } from './AuthContext';
import { api, getApiErrorMessage } from '@/utils/api';

interface OrderContextType {
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  currentOrder: Partial<Order> | null;
  isLoading: boolean;
  isOrderSyncing: (orderId: string) => boolean;

  createOrder: (orderType: OrderType, tableId?: string) => void;
  addItemToOrder: (
    menuItem: MenuItem,
    quantity: number,
    notes?: string,
    addOnIds?: string[],
  ) => void;
  removeItemFromOrder: (itemIndex: number) => void;
  updateItemQuantity: (itemIndex: number, quantity: number) => void;
  submitOrder: (
    customerName?: string,
    customerPhone?: string,
    pickupTime?: Date,
    expressCheckout?: boolean,
  ) => Promise<Order>;
  cancelCurrentOrder: () => void;

  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: 'cash' | 'upi' | 'split',
    cashAmount?: number,
    upiAmount?: number,
  ) => Promise<void>;
  processPayment: (
    orderId: string,
    paymentMethod: 'cash' | 'upi' | 'split',
    cashAmount?: number,
    upiAmount?: number,
  ) => Promise<void>;
  updateItemStatus: (
    orderId: string,
    itemId: string,
    status: OrderItemStatus,
  ) => void;
  startPreparingOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => void;
  editExistingOrder: (orderId: string) => void;
  addItemsToExistingOrder: () => Promise<void>;

  updateTableStatus: (
    tableId: string,
    status: Table['status'],
    orderIds?: string[],
  ) => void;
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
  const [syncingOrderIds, setSyncingOrderIds] = useState<Set<string>>(
    new Set(),
  );
  const { playReadySound } = useNotificationSound();
  const { user } = useAuth();
  const prevReadyCountRef = useRef<number>(0);
  const lastUpdatedRef = useRef<string | null>(null);

  const fetchStaticData = useCallback(async () => {
    try {
      console.log('Fetching static data (menu/categories)...');
      const [menuRes, categoriesRes] = await Promise.all([
        api.get('/api/menu-items'),
        api.get('/api/categories'),
      ]);

      setMenuItems(menuRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch static data:', error);
    }
  }, []);

  const fetchData = useCallback(async (isPoll = false) => {
    try {
      let url = '/api/orders';
      if (isPoll && lastUpdatedRef.current) {
        url += `?since=${encodeURIComponent(lastUpdatedRef.current)}`;
      }

      const [ordersRes, tablesRes] = await Promise.all([
        api.get(url),
        api.get('/api/tables'),
      ]);

      const ordersData = ordersRes.data;
      const parsedOrders = ordersData.map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
        servedAt: o.servedAt ? new Date(o.servedAt) : undefined,
        paidAt: o.paidAt ? new Date(o.paidAt) : undefined,
        pickupTime: o.pickupTime ? new Date(o.pickupTime) : undefined,
      }));

      if (!isPoll) {
        setOrders(parsedOrders);
        if (parsedOrders.length > 0) {
          const maxUpdated = new Date(
            Math.max(...parsedOrders.map((o: any) => o.updatedAt.getTime())),
          );
          lastUpdatedRef.current = maxUpdated.toISOString();
        } else {
          lastUpdatedRef.current = new Date().toISOString();
        }
      } else if (parsedOrders.length > 0) {
        setOrders((prev) => {
          const newOrders = [...prev];
          parsedOrders.forEach((updated: Order) => {
            const idx = newOrders.findIndex((o) => o.id === updated.id);
            if (idx !== -1) {
              newOrders[idx] = updated;
            } else {
              newOrders.unshift(updated);
            }
          });
          return newOrders;
        });
        const maxUpdated = new Date(
          Math.max(...parsedOrders.map((o: any) => o.updatedAt.getTime())),
        );
        lastUpdatedRef.current = maxUpdated.toISOString();
      }

      const tablesData = tablesRes.data;
      setTables(
        tablesData.map((t: any) => ({
          ...t,
          currentOrderIds: t.currentOrderIds || [],
        })),
      );
    } catch (error) {
      console.error('Failed to poll data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaticData();
    // Initial load: Fetch everything
    fetchData(false);

    // Auto-refresh orders/tables using delta polling every 10 seconds.
    const dataIntervalId = setInterval(() => {
      fetchData(true);
    }, 10000);

    // Static menu/category data changes less frequently; refresh once per minute.
    const staticIntervalId = setInterval(() => {
      fetchStaticData();
    }, 60000);

    return () => {
      clearInterval(dataIntervalId);
      clearInterval(staticIntervalId);
    };
  }, [fetchData, fetchStaticData]);

  useEffect(() => {
    const readyCount = orders.filter((o) => o.status === 'ready').length;
    if (
      readyCount > prevReadyCountRef.current &&
      prevReadyCountRef.current !== 0
    ) {
      playReadySound();
    }
    prevReadyCountRef.current = readyCount;
  }, [orders, playReadySound]);

  useEffect(() => {
    if (isLoading || tables.length === 0) return;

    const activeStatuses = ['new', 'preparing', 'ready', 'served'];

    tables.forEach((table) => {
      const activeOrders = orders.filter(
        (o) =>
          o.tableNumber === table.tableNumber &&
          activeStatuses.includes(o.status),
      );

      const shouldBeOccupied = activeOrders.length > 0;
      const isCurrentlyOccupied = table.status === 'occupied';

      if (shouldBeOccupied !== isCurrentlyOccupied) {
        const newStatus = shouldBeOccupied ? 'occupied' : 'available';
        const newOrderIds = activeOrders.map((o) => o.id);

        setTables((prev) =>
          prev.map((t) =>
            t.id === table.id
              ? { ...t, status: newStatus, currentOrderIds: newOrderIds }
              : t,
          ),
        );

        api
          .patch(`/api/tables/${table.id}`, {
            status: newStatus,
            currentOrderIds: newOrderIds,
          })
          .catch(console.error);
      }
    });
  }, [isLoading, orders, tables]);

  const createOrder = useCallback(
    (orderType: OrderType, tableId?: string) => {
      const table = tableId ? tables.find((t) => t.id === tableId) : undefined;
      setCurrentOrder({
        orderType,
        tableId,
        tableNumber: table?.tableNumber,
        items: [],
        status: 'new',
      });
    },
    [tables],
  );

  const addItemToOrder = useCallback(
    (
      menuItem: MenuItem,
      quantity: number,
      notes?: string,
      addOnIds?: string[],
    ) => {
      if (!currentOrder) return;

      const selectedAddOns = addOnIds
        ? menuItem.addOns
            .filter((a) => addOnIds.includes(a.id))
            .map((a) => ({
              addOnId: a.id,
              name: a.name,
              price: a.price,
            }))
        : [];

      const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
      const itemTotal = (menuItem.price + addOnsTotal) * quantity;

      setCurrentOrder((prev) => {
        if (!prev) return null;

        const existingItems = [...(prev.items || [])];

        // Check if item with same ID, addons and notes already exists
        const existingItemIndex = existingItems.findIndex(
          (item) =>
            item.menuItemId === menuItem.id &&
            JSON.stringify(item.addOns) === JSON.stringify(selectedAddOns) &&
            (item.notes || '') === (notes || ''),
        );

        if (existingItemIndex !== -1) {
          // Update existing item
          const existingItem = existingItems[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;
          existingItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: (existingItem.unitPrice + addOnsTotal) * newQuantity,
          };
        } else {
          // Add new item
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
          existingItems.push(newItem);
        }

        return {
          ...prev,
          items: existingItems,
        };
      });
    },
    [currentOrder],
  );

  const removeItemFromOrder = useCallback(
    (itemIndex: number) => {
      if (!currentOrder?.items) return;
      setCurrentOrder((prev) => ({
        ...prev,
        items: prev?.items?.filter((_, i) => i !== itemIndex) || [],
      }));
    },
    [currentOrder],
  );

  const updateItemQuantity = useCallback(
    (itemIndex: number, quantity: number) => {
      if (!currentOrder?.items || quantity < 1) return;
      setCurrentOrder((prev) => ({
        ...prev,
        items:
          prev?.items?.map((item, i) => {
            if (i !== itemIndex) return item;
            const addOnsTotal = item.addOns.reduce(
              (sum, a) => sum + a.price,
              0,
            );
            return {
              ...item,
              quantity,
              totalPrice: (item.unitPrice + addOnsTotal) * quantity,
            };
          }) || [],
      }));
    },
    [currentOrder],
  );

  const submitOrder = useCallback(
    async (
      customerName?: string,
      customerPhone?: string,
      pickupTime?: Date,
      expressCheckout?: boolean,
    ): Promise<Order> => {
      const traceEnabled = import.meta.env.DEV;
      const startedAt = performance.now();

      if (!currentOrder?.items?.length) {
        throw new Error('No items in order');
      }

      const totals = calculateOrderTotals(
        currentOrder.items as OrderItem[],
        currentOrder.orderType as OrderType,
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
        createdBy: user?.name || 'Unknown',
      };

      const optimisticOrderId = newOrder.id;
      const submittingTableId = currentOrder.tableId;

      // Optimistically show the new order immediately and reconcile once API responds.
      setOrders((prev) => [newOrder, ...prev]);
      if (submittingTableId) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === submittingTableId
              ? {
                  ...t,
                  status: 'occupied',
                  currentOrderIds: Array.from(
                    new Set([...(t.currentOrderIds || []), optimisticOrderId]),
                  ),
                }
              : t,
          ),
        );
      }

      const beforeRequestAt = performance.now();

      try {
        const endpoint = expressCheckout
          ? '/api/orders/checkout'
          : '/api/orders';
        const response = await api.post(endpoint, {
          ...newOrder,
          expressCheckout,
        });
        const afterRequestAt = performance.now();
        const savedOrder = response.data;
        const parsedOrder = {
          ...savedOrder,
          createdAt: new Date(savedOrder.createdAt),
          updatedAt: new Date(savedOrder.updatedAt),
        };

        setOrders((prev) => {
          const withoutOptimistic = prev.filter(
            (o) => o.id !== optimisticOrderId,
          );
          return [parsedOrder, ...withoutOptimistic];
        });

        // Table state is orchestrated in backend transaction for order creation.
        if (submittingTableId) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === submittingTableId
                ? {
                    ...t,
                    status:
                      parsedOrder.status === 'collected' &&
                      (t.currentOrderIds?.filter((id) => id !== parsedOrder.id)
                        .length ?? 0) === 0
                        ? 'available'
                        : 'occupied',
                    currentOrderIds:
                      parsedOrder.status === 'collected'
                        ? (t.currentOrderIds || [])
                            .map((id) =>
                              id === optimisticOrderId ? parsedOrder.id : id,
                            )
                            .filter((id) => id !== parsedOrder.id)
                        : Array.from(
                            new Set([
                              ...(t.currentOrderIds || []).map((id) =>
                                id === optimisticOrderId ? parsedOrder.id : id,
                              ),
                              parsedOrder.id,
                            ]),
                          ),
                  }
                : t,
            ),
          );
        }

        setCurrentOrder(null);

        if (traceEnabled) {
          const completedAt = performance.now();
          const prepMs = Math.round(beforeRequestAt - startedAt);
          const apiMs = Math.round(afterRequestAt - beforeRequestAt);
          const stateMs = Math.round(completedAt - afterRequestAt);
          const totalMs = Math.round(completedAt - startedAt);
          console.info(
            `[OrderSubmitTiming] total=${totalMs}ms prep=${prepMs}ms api=${apiMs}ms state=${stateMs}ms`,
          );
        }

        return parsedOrder;
      } catch (error) {
        setOrders((prev) => prev.filter((o) => o.id !== optimisticOrderId));
        if (submittingTableId) {
          setTables((prev) =>
            prev.map((t) => {
              if (t.id !== submittingTableId) return t;
              const nextOrderIds = (t.currentOrderIds || []).filter(
                (id) => id !== optimisticOrderId,
              );
              return {
                ...t,
                status: nextOrderIds.length > 0 ? 'occupied' : 'available',
                currentOrderIds: nextOrderIds,
              };
            }),
          );
        }
        if (traceEnabled) {
          const failedAt = performance.now();
          const totalMs = Math.round(failedAt - startedAt);
          console.info(`[OrderSubmitTiming] failed after ${totalMs}ms`);
        }
        const errText = getApiErrorMessage(error, 'Failed to create order');
        console.error('Failed to submit order:', errText);
        throw new Error(errText);
      }
    },
    [currentOrder, user],
  );

  const cancelCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  const isOrderSyncing = useCallback(
    (orderId: string) => syncingOrderIds.has(orderId),
    [syncingOrderIds],
  );

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      paymentMethod?: 'cash' | 'upi' | 'split',
      cashAmount?: number,
      upiAmount?: number,
    ) => {
      setSyncingOrderIds((prev) => {
        const next = new Set(prev);
        next.add(orderId);
        return next;
      });

      const previousOrders = orders;
      const previousTables = tables;
      const updates: any = { status };
      const actionTime = new Date();

      if (status === 'served' || status === 'collected') {
        updates.servedAt = actionTime.toISOString();
      }

      if (status === 'collected' && paymentMethod) {
        updates.paymentMethod = paymentMethod;
        updates.paymentStatus = 'completed';
        updates.paidAt = actionTime.toISOString();
        if (
          paymentMethod === 'split' &&
          cashAmount !== undefined &&
          upiAmount !== undefined
        ) {
          updates.cashAmount = cashAmount;
          updates.upiAmount = upiAmount;
        }
      }

      const optimisticOrders = previousOrders.map((order) => {
        if (order.id !== orderId) return order;

        const orderUpdates: Partial<Order> = {
          status,
          updatedAt: actionTime,
        };

        if (status === 'collected' && paymentMethod) {
          orderUpdates.payment = {
            id: `pay-${Date.now()}`,
            orderId,
            method: paymentMethod,
            amount: order.totalAmount,
            status: 'completed',
            paidAt: actionTime,
          };
        }

        if (status === 'served') {
          orderUpdates.servedAt = actionTime;
        }

        return { ...order, ...orderUpdates };
      });

      setOrders(optimisticOrders);

      let updatedTableId: string | null = null;
      let updatedTablePayload: {
        status: 'occupied' | 'available';
        currentOrderIds: string[];
      } | null = null;

      if (status === 'collected') {
        const updatedOrder = optimisticOrders.find((o) => o.id === orderId);
        if (updatedOrder?.tableNumber) {
          const table = previousTables.find(
            (t) => t.tableNumber === updatedOrder.tableNumber,
          );

          if (table) {
            const newOrderIds = table.currentOrderIds.filter(
              (id) => id !== orderId,
            );
            const activeStatuses = ['new', 'preparing', 'ready', 'served'];
            const remainingActiveOrders = optimisticOrders.filter(
              (o) =>
                o.id !== orderId &&
                o.tableNumber === updatedOrder.tableNumber &&
                activeStatuses.includes(o.status),
            );
            const newStatus: 'occupied' | 'available' =
              remainingActiveOrders.length > 0 ? 'occupied' : 'available';

            updatedTableId = table.id;
            updatedTablePayload = {
              status: newStatus,
              currentOrderIds: newOrderIds,
            };

            const optimisticTables = previousTables.map((t) =>
              t.id === table.id
                ? {
                    ...t,
                    status: newStatus as TableStatus,
                    currentOrderIds: newOrderIds,
                  }
                : t,
            );
            setTables(optimisticTables);
          }
        }
      }

      try {
        await api.patch(`/api/orders/${orderId}`, updates);

        if (updatedTableId && updatedTablePayload) {
          api
            .patch(`/api/tables/${updatedTableId}`, updatedTablePayload)
            .catch(console.error);
        }
      } catch (error) {
        setOrders(previousOrders);
        setTables(previousTables);
        const errText = getApiErrorMessage(
          error,
          'Failed to update order status',
        );
        console.error('Failed to update order:', errText);
        throw new Error(errText);
      } finally {
        setSyncingOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [tables, orders],
  );

  const processPayment = useCallback(
    async (
      orderId: string,
      paymentMethod: 'cash' | 'upi' | 'split',
      cashAmount?: number,
      upiAmount?: number,
    ) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      return updateOrderStatus(
        orderId,
        'collected',
        paymentMethod,
        cashAmount,
        upiAmount,
      );
    },
    [orders, updateOrderStatus],
  );

  const updateItemStatus = useCallback(
    async (orderId: string, itemId: string, status: OrderItemStatus) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const updatedItems = order.items.map((item) =>
        item.id === itemId ? { ...item, status } : item,
      );

      const allReady = updatedItems.every((item) => item.status === 'ready');
      const anyPreparing = updatedItems.some(
        (item) => item.status === 'preparing',
      );

      let newOrderStatus = order.status;
      if (
        allReady &&
        order.status !== 'served' &&
        order.status !== 'collected'
      ) {
        newOrderStatus = 'ready';
      } else if (anyPreparing && order.status === 'new') {
        newOrderStatus = 'preparing';
      }

      const previousOrders = orders;
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            items: updatedItems,
            status: newOrderStatus,
            updatedAt: new Date(),
          };
        }),
      );

      try {
        await api.patch(`/api/orders/${orderId}`, {
          items: updatedItems,
          status: newOrderStatus,
        });
      } catch (error) {
        setOrders(previousOrders);
        console.error('Failed to update item status:', error);
      }
    },
    [orders],
  );

  const startPreparingOrder = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const updatedItems = order.items.map((item) =>
        item.status === 'pending'
          ? { ...item, status: 'preparing' as OrderItemStatus }
          : item,
      );

      const previousOrders = orders;
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            items: updatedItems,
            status: 'preparing',
            updatedAt: new Date(),
          };
        }),
      );

      try {
        await api.patch(`/api/orders/${orderId}`, {
          items: updatedItems,
          status: 'preparing',
        });
      } catch (error) {
        setOrders(previousOrders);
        console.error('Failed to start preparing order:', error);
      }
    },
    [orders],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      try {
        await api.patch(`/api/orders/${orderId}`, { status: 'cancelled' });

        if (order.tableNumber) {
          const table = tables.find((t) => t.tableNumber === order.tableNumber);
          if (table) {
            const newOrderIds = table.currentOrderIds.filter(
              (id) => id !== orderId,
            );
            const newStatus = newOrderIds.length > 0 ? 'occupied' : 'available';

            setTables((prev) =>
              prev.map((t) => {
                if (t.tableNumber !== order.tableNumber) return t;
                return {
                  ...t,
                  status: newStatus as TableStatus,
                  currentOrderIds: newOrderIds,
                };
              }),
            );

            api
              .patch(`/api/tables/${table.id}`, {
                status: newStatus,
                currentOrderIds: newOrderIds,
              })
              .catch((e) =>
                console.error('Failed to update table status on cancel', e),
              );
          }
        }

        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o,
          ),
        );
      } catch (error) {
        console.error('Failed to cancel order:', error);
      }
    },
    [orders, tables],
  );

  const editExistingOrder = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      setCurrentOrder({
        id: order.id,
        orderType: order.orderType,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        items: [],
        status: order.status,
        existingOrderId: order.id,
      });
    },
    [orders],
  );

  const addItemsToExistingOrder = useCallback(async () => {
    if (!currentOrder?.existingOrderId || !currentOrder.items?.length) return;

    const existingOrder = orders.find(
      (o) => o.id === currentOrder.existingOrderId,
    );
    if (!existingOrder) return;

    const newItems = [
      ...existingOrder.items,
      ...(currentOrder.items as OrderItem[]),
    ];
    const totals = calculateOrderTotals(newItems, existingOrder.orderType);

    try {
      await api.patch(`/api/orders/${currentOrder.existingOrderId}`, {
        items: newItems,
        ...totals,
        status: 'new',
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === currentOrder.existingOrderId
            ? {
                ...o,
                items: newItems,
                ...totals,
                status: 'new' as OrderStatus,
                updatedAt: new Date(),
              }
            : o,
        ),
      );

      setCurrentOrder(null);
    } catch (error) {
      console.error('Failed to add items to order:', error);
    }
  }, [currentOrder, orders]);

  const updateTableStatus = useCallback(
    async (tableId: string, status: Table['status'], orderIds?: string[]) => {
      try {
        const table = tables.find((t) => t.id === tableId);
        const newOrderIds = orderIds ?? table?.currentOrderIds ?? [];

        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? { ...t, status, currentOrderIds: newOrderIds }
              : t,
          ),
        );

        await api.patch(`/api/tables/${tableId}`, {
          status,
          currentOrderIds: newOrderIds,
        });
      } catch (error) {
        console.error('Failed to update table status:', error);
      }
    },
    [tables],
  );

  const getOrdersByStatus = useCallback(
    (statuses: OrderStatus[]) => {
      return orders.filter((o) => statuses.includes(o.status));
    },
    [orders],
  );

  const getOrdersByType = useCallback(
    (type: OrderType) => {
      return orders.filter((o) => o.orderType === type);
    },
    [orders],
  );

  const getActiveKitchenOrders = useCallback(() => {
    return orders
      .filter((o) => ['new', 'preparing', 'ready'].includes(o.status))
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
        isOrderSyncing,
        createOrder,
        addItemToOrder,
        removeItemFromOrder,
        updateItemQuantity,
        submitOrder,
        cancelCurrentOrder,
        updateOrderStatus,
        processPayment,
        updateItemStatus,
        startPreparingOrder,
        cancelOrder,
        editExistingOrder,
        addItemsToExistingOrder,
        updateTableStatus,
        refreshData: () => {
          fetchData();
          fetchStaticData();
        },
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
