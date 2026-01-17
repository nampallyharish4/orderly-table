import { User, MenuCategory, MenuItem, Table, Order, OrderItem } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@restaurant.com',
    phone: '+1234567890',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    name: 'John Waiter',
    email: 'john@restaurant.com',
    phone: '+1234567891',
    role: 'waiter',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user-3',
    name: 'Sarah Cashier',
    email: 'sarah@restaurant.com',
    phone: '+1234567892',
    role: 'cashier',
    isActive: true,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'user-4',
    name: 'Mike Kitchen',
    email: 'mike@restaurant.com',
    phone: '+1234567893',
    role: 'kitchen',
    isActive: true,
    createdAt: new Date('2024-02-15'),
  },
];

// Mock Categories
export const mockCategories: MenuCategory[] = [
  { id: 'cat-1', name: 'Starters', description: 'Appetizers and small bites', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Main Course', description: 'Signature dishes', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Pizzas', description: 'Wood-fired pizzas', sortOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Burgers', description: 'Gourmet burgers', sortOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Beverages', description: 'Drinks and refreshments', sortOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Desserts', description: 'Sweet endings', sortOrder: 6, isActive: true },
];

// Mock Menu Items
export const mockMenuItems: MenuItem[] = [
  // Starters
  {
    id: 'item-1',
    categoryId: 'cat-1',
    name: 'Crispy Calamari',
    description: 'Lightly battered squid rings with garlic aioli',
    price: 12.99,
    isVeg: false,
    isAvailable: true,
    addOns: [
      { id: 'addon-1', name: 'Extra Sauce', price: 1.50 },
    ],
    preparationTime: 10,
    sortOrder: 1,
  },
  {
    id: 'item-2',
    categoryId: 'cat-1',
    name: 'Bruschetta',
    description: 'Grilled bread with tomatoes, basil, and balsamic',
    price: 8.99,
    isVeg: true,
    isAvailable: true,
    addOns: [],
    preparationTime: 8,
    sortOrder: 2,
  },
  {
    id: 'item-3',
    categoryId: 'cat-1',
    name: 'Buffalo Wings',
    description: 'Crispy chicken wings in spicy buffalo sauce',
    price: 14.99,
    isVeg: false,
    isAvailable: true,
    addOns: [
      { id: 'addon-2', name: 'Blue Cheese Dip', price: 2.00 },
      { id: 'addon-3', name: 'Extra Spicy', price: 0 },
    ],
    preparationTime: 15,
    sortOrder: 3,
  },
  // Main Course
  {
    id: 'item-4',
    categoryId: 'cat-2',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon herb butter',
    price: 24.99,
    isVeg: false,
    isAvailable: true,
    addOns: [
      { id: 'addon-4', name: 'Extra Vegetables', price: 3.00 },
    ],
    preparationTime: 20,
    sortOrder: 1,
  },
  {
    id: 'item-5',
    categoryId: 'cat-2',
    name: 'Ribeye Steak',
    description: '12oz USDA Prime ribeye with garlic butter',
    price: 34.99,
    isVeg: false,
    isAvailable: true,
    addOns: [
      { id: 'addon-5', name: 'Mushroom Sauce', price: 3.50 },
      { id: 'addon-6', name: 'Loaded Potato', price: 4.00 },
    ],
    preparationTime: 25,
    sortOrder: 2,
  },
  {
    id: 'item-6',
    categoryId: 'cat-2',
    name: 'Vegetable Risotto',
    description: 'Creamy arborio rice with seasonal vegetables',
    price: 18.99,
    isVeg: true,
    isAvailable: true,
    addOns: [
      { id: 'addon-7', name: 'Truffle Oil', price: 5.00 },
    ],
    preparationTime: 18,
    sortOrder: 3,
  },
  // Pizzas
  {
    id: 'item-7',
    categoryId: 'cat-3',
    name: 'Margherita',
    description: 'Fresh mozzarella, tomato, and basil',
    price: 16.99,
    isVeg: true,
    isAvailable: true,
    addOns: [
      { id: 'addon-8', name: 'Extra Cheese', price: 2.50 },
    ],
    preparationTime: 12,
    sortOrder: 1,
  },
  {
    id: 'item-8',
    categoryId: 'cat-3',
    name: 'Pepperoni Supreme',
    description: 'Loaded with pepperoni and mozzarella',
    price: 19.99,
    isVeg: false,
    isAvailable: true,
    addOns: [
      { id: 'addon-9', name: 'Stuffed Crust', price: 3.00 },
    ],
    preparationTime: 15,
    sortOrder: 2,
  },
  {
    id: 'item-9',
    categoryId: 'cat-3',
    name: 'BBQ Chicken',
    description: 'Grilled chicken with BBQ sauce and red onions',
    price: 21.99,
    isVeg: false,
    isAvailable: false,
    addOns: [],
    preparationTime: 15,
    sortOrder: 3,
  },
  // Burgers
  {
    id: 'item-10',
    categoryId: 'cat-4',
    name: 'Classic Cheeseburger',
    description: 'Angus beef with cheddar, lettuce, tomato',
    price: 15.99,
    isVeg: false,
    isAvailable: true,
    addOns: [
      { id: 'addon-10', name: 'Bacon', price: 2.50 },
      { id: 'addon-11', name: 'Avocado', price: 2.00 },
    ],
    preparationTime: 12,
    sortOrder: 1,
  },
  {
    id: 'item-11',
    categoryId: 'cat-4',
    name: 'Veggie Burger',
    description: 'Black bean patty with chipotle mayo',
    price: 14.99,
    isVeg: true,
    isAvailable: true,
    addOns: [
      { id: 'addon-12', name: 'Vegan Cheese', price: 1.50 },
    ],
    preparationTime: 10,
    sortOrder: 2,
  },
  // Beverages
  {
    id: 'item-12',
    categoryId: 'cat-5',
    name: 'Fresh Lemonade',
    description: 'House-made with mint',
    price: 4.99,
    isVeg: true,
    isAvailable: true,
    addOns: [],
    preparationTime: 2,
    sortOrder: 1,
  },
  {
    id: 'item-13',
    categoryId: 'cat-5',
    name: 'Craft Beer',
    description: 'Selection of local craft beers',
    price: 7.99,
    isVeg: true,
    isAvailable: true,
    addOns: [],
    preparationTime: 1,
    sortOrder: 2,
  },
  {
    id: 'item-14',
    categoryId: 'cat-5',
    name: 'Espresso',
    description: 'Double shot Italian espresso',
    price: 3.99,
    isVeg: true,
    isAvailable: true,
    addOns: [
      { id: 'addon-13', name: 'Extra Shot', price: 1.00 },
    ],
    preparationTime: 3,
    sortOrder: 3,
  },
  // Desserts
  {
    id: 'item-15',
    categoryId: 'cat-6',
    name: 'Tiramisu',
    description: 'Classic Italian coffee dessert',
    price: 9.99,
    isVeg: true,
    isAvailable: true,
    addOns: [],
    preparationTime: 5,
    sortOrder: 1,
  },
  {
    id: 'item-16',
    categoryId: 'cat-6',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center',
    price: 10.99,
    isVeg: true,
    isAvailable: true,
    addOns: [
      { id: 'addon-14', name: 'Ice Cream', price: 2.50 },
    ],
    preparationTime: 15,
    sortOrder: 2,
  },
];

// Mock Tables
export const mockTables: Table[] = [
  { id: 'table-1', tableNumber: 'T1', capacity: 6, floor: 'Large Tables', status: 'available', currentOrderIds: [] },
  { id: 'table-2', tableNumber: 'T2', capacity: 6, floor: 'Large Tables', status: 'available', currentOrderIds: [] },
  { id: 'table-placeholder', tableNumber: '', capacity: 0, floor: 'Large Tables', status: 'available', currentOrderIds: [], hidden: true } as Table & { hidden: boolean },
  { id: 'table-4', tableNumber: 'T4', capacity: 6, floor: 'Large Tables', status: 'available', currentOrderIds: [] },
  { id: 'table-5', tableNumber: 'T5', capacity: 6, floor: 'Large Tables', status: 'available', currentOrderIds: [] },
  { id: 'table-6', tableNumber: 'T6', capacity: 6, floor: 'Large Tables', status: 'available', currentOrderIds: [] },
  { id: 'table-7', tableNumber: 'T7', capacity: 6, floor: 'Large Tables', status: 'available', currentOrderIds: [] },
  { id: 'table-8', tableNumber: 'T8', capacity: 6, floor: 'Large Tables', status: 'available', currentOrderIds: [] },
  { id: 'table-9', tableNumber: 'P1', capacity: 4, floor: 'Patio', status: 'available', currentOrderIds: [] },
  { id: 'table-10', tableNumber: 'P2', capacity: 4, floor: 'Patio', status: 'available', currentOrderIds: [] },
  { id: 'table-11', tableNumber: 'P3', capacity: 6, floor: 'Patio', status: 'available', currentOrderIds: [] },
  { id: 'table-12', tableNumber: 'B1', capacity: 10, floor: 'Banquet', status: 'available', currentOrderIds: [] },
];

// Mock Orders - empty by default
export const mockOrders: Order[] = [];

// Helper function to generate order number
let orderCounter = 0;
export function generateOrderNumber(): string {
  orderCounter++;
  return `ORD-${String(orderCounter).padStart(3, '0')}`;
}

// Helper function to calculate order totals
export function calculateOrderTotals(items: OrderItem[], orderType: 'dine-in' | 'takeaway') {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.08; // 8% tax
  const serviceChargeRate = orderType === 'dine-in' ? 0.10 : 0; // 10% service charge for dine-in only
  
  const taxAmount = subtotal * taxRate;
  const serviceCharge = subtotal * serviceChargeRate;
  const totalAmount = subtotal + taxAmount + serviceCharge;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    serviceCharge: Number(serviceCharge.toFixed(2)),
    discountAmount: 0,
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}
