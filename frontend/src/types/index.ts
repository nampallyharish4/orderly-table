// Restaurant POS Core Types

export type UserRole = 'admin' | 'waiter' | 'cashier' | 'kitchen';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuAddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  addOns: MenuAddOn[];
  preparationTime?: number; // in minutes
  sortOrder: number;
}

export type TableStatus = 'available' | 'occupied';

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  floor: string;
  status: TableStatus;
  currentOrderIds: string[];
}

export type OrderType = 'dine-in' | 'takeaway';
export type OrderStatus =
  | 'new'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'collected'
  | 'cancelled';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready';

export interface OrderItemAddOn {
  addOnId: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  addOns: OrderItemAddOn[];
  status: OrderItemStatus;
  isVeg: boolean;
}

export type PaymentMethod = 'cash' | 'upi' | 'split';
export type PaymentStatus = 'pending' | 'completed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  cashAmount?: number;
  upiAmount?: number;
  status: PaymentStatus;
  transactionId?: string;
  paidAt: Date;
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
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  payment?: Payment;
  pickupTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  servedAt?: Date;
  existingOrderId?: string;
  createdBy: string;
}

// Kitchen Display specific
export interface KitchenOrderView {
  order: Order;
  elapsedMinutes: number;
  priority: 'normal' | 'rush' | 'overdue';
}

// Reports
export interface DailySalesReport {
  date: Date;
  totalOrders: number;
  totalSales: number;
  dineInOrders: number;
  dineInSales: number;
  takeawayOrders: number;
  takeawaySales: number;
  cashPayments: number;
  cardPayments: number;
  upiPayments: number;
}

export interface ItemSalesReport {
  menuItemId: string;
  menuItemName: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
}

// Auth context
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'manage_users',
    'manage_menu',
    'manage_tables',
    'view_reports',
    'manage_settings',
    'create_orders',
    'manage_orders',
    'process_payments',
    'view_kitchen',
    'print_bill',
  ],
  waiter: ['create_orders', 'manage_orders', 'view_tables', 'view_menu'],
  cashier: [
    'create_orders',
    'manage_orders',
    'process_payments',
    'view_menu',
    'view_tables',
    'print_bill',
  ],
  kitchen: ['view_kitchen', 'update_order_status'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, string[]> = {
    '/': ['admin', 'waiter', 'cashier', 'kitchen'],
    '/tables': ['admin', 'waiter', 'cashier'],
    '/menu': ['admin'],
    '/orders': ['admin', 'waiter', 'cashier'],
    '/orders/new': ['admin', 'waiter', 'cashier'],
    '/reservations': ['admin', 'waiter', 'cashier'],
    '/kitchen': ['admin', 'kitchen'],
    '/billing': ['admin', 'cashier'],
    '/reports': ['admin'],
    '/settings': ['admin'],
    '/users': ['admin'],
  };

  // Handle dynamic routes like /orders/:id
  if (route.startsWith('/orders/') && route !== '/orders/new') {
    return ['admin', 'waiter', 'cashier'].includes(role);
  }

  return routePermissions[route]?.includes(role) ?? false;
}
