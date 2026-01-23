import { pgTable, text, integer, boolean, timestamp, real, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = ["admin", "waiter", "cashier", "kitchen"] as const;
export type UserRole = typeof userRoleEnum[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  visibleId: text("visible_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  role: text("role").notNull().$type<UserRole>(),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  visibleId: text("visible_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  visibleId: text("visible_id").notNull().unique(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  isVeg: boolean("is_veg").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  addOns: jsonb("add_ons").notNull().default([]),
  preparationTime: integer("preparation_time"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

export const tableStatusEnum = ["available", "occupied"] as const;
export type TableStatus = typeof tableStatusEnum[number];

export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  visibleId: text("visible_id").notNull().unique(),
  tableNumber: text("table_number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  floor: text("floor").notNull(),
  status: text("status").notNull().$type<TableStatus>().default("available"),
  currentOrderIds: jsonb("current_order_ids").notNull().default([]),
});

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;

export const orderTypeEnum = ["dine-in", "takeaway"] as const;
export type OrderType = typeof orderTypeEnum[number];

export const orderStatusEnum = ["new", "preparing", "ready", "served", "collected", "cancelled"] as const;
export type OrderStatus = typeof orderStatusEnum[number];

export const paymentMethodEnum = ["cash", "card", "upi"] as const;
export type PaymentMethod = typeof paymentMethodEnum[number];

export const paymentStatusEnum = ["pending", "completed", "refunded"] as const;
export type PaymentStatus = typeof paymentStatusEnum[number];

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  visibleId: text("visible_id").notNull().unique(),
  orderNumber: text("order_number").notNull().unique(),
  orderType: text("order_type").notNull().$type<OrderType>(),
  tableId: integer("table_id"),
  tableNumber: text("table_number"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  items: jsonb("items").notNull().default([]),
  subtotal: real("subtotal").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  serviceCharge: real("service_charge").notNull().default(0),
  discountAmount: real("discount_amount").notNull().default(0),
  totalAmount: real("total_amount").notNull().default(0),
  status: text("status").notNull().$type<OrderStatus>().default("new"),
  paymentMethod: text("payment_method").$type<PaymentMethod>(),
  paymentStatus: text("payment_status").$type<PaymentStatus>(),
  paymentTransactionId: text("payment_transaction_id"),
  paidAt: timestamp("paid_at"),
  pickupTime: timestamp("pickup_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  servedAt: timestamp("served_at"),
  createdBy: text("created_by").notNull(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
