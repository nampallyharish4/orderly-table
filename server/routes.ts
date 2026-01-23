import { Express, Request, Response } from 'express';
import { db } from './db.js';
import * as schema from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const { orders, tables, menuItems, menuCategories } = schema;

export function registerRoutes(app: Express) {
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const formattedOrders = allOrders.map(order => ({
        ...order,
        id: order.visibleId,
        items: order.items as any[],
      }));
      res.json(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const orderData = req.body;
      const visibleId = orderData.id || `order-${Date.now()}`;
      
      const [newOrder] = await db.insert(orders).values({
        visibleId,
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType,
        tableId: orderData.tableId ? parseInt(orderData.tableId.replace('table-', '')) : null,
        tableNumber: orderData.tableNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        taxAmount: orderData.taxAmount || 0,
        serviceCharge: orderData.serviceCharge || 0,
        discountAmount: orderData.discountAmount || 0,
        totalAmount: orderData.totalAmount || 0,
        status: orderData.status || 'new',
        notes: orderData.notes,
        createdBy: orderData.createdBy || 'system',
      }).returning();

      res.json({ ...newOrder, id: newOrder.visibleId });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.patch('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updateData: any = {};
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.items !== undefined) updateData.items = updates.items;
      if (updates.paymentMethod !== undefined) updateData.paymentMethod = updates.paymentMethod;
      if (updates.paymentStatus !== undefined) updateData.paymentStatus = updates.paymentStatus;
      if (updates.paidAt !== undefined) updateData.paidAt = new Date(updates.paidAt);
      if (updates.servedAt !== undefined) updateData.servedAt = new Date(updates.servedAt);
      updateData.updatedAt = new Date();

      const [updatedOrder] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.visibleId, id))
        .returning();

      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ ...updatedOrder, id: updatedOrder.visibleId });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  app.delete('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(orders).where(eq(orders.visibleId, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  app.get('/api/tables', async (req: Request, res: Response) => {
    try {
      const allTables = await db.select().from(tables);
      const formattedTables = allTables.map(table => ({
        ...table,
        id: table.visibleId,
      }));
      res.json(formattedTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      res.status(500).json({ error: 'Failed to fetch tables' });
    }
  });

  app.patch('/api/tables/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [updatedTable] = await db
        .update(tables)
        .set({ status })
        .where(eq(tables.visibleId, id))
        .returning();

      if (!updatedTable) {
        return res.status(404).json({ error: 'Table not found' });
      }

      res.json({ ...updatedTable, id: updatedTable.visibleId });
    } catch (error) {
      console.error('Error updating table:', error);
      res.status(500).json({ error: 'Failed to update table' });
    }
  });

  app.get('/api/menu-items', async (req: Request, res: Response) => {
    try {
      const allItems = await db.select().from(menuItems);
      const allCategories = await db.select().from(menuCategories);
      
      const categoryMap = new Map(allCategories.map(c => [c.id, c]));
      
      const formattedItems = allItems.map(item => ({
        ...item,
        id: item.visibleId,
        categoryId: categoryMap.get(item.categoryId)?.visibleId || '',
        category: categoryMap.get(item.categoryId)?.name || '',
        addOns: (item.addOns as any[]) || [],
      }));
      res.json(formattedItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ error: 'Failed to fetch menu items' });
    }
  });

  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const allCategories = await db.select().from(menuCategories);
      const formattedCategories = allCategories.map(cat => ({
        ...cat,
        id: cat.visibleId,
      }));
      res.json(formattedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
}
