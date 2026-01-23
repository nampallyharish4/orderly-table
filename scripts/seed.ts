import { db, pool } from "../server/db";
import { users, menuCategories, menuItems, tables } from "../shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Seed Users
  const usersData = [
    { visibleId: "user-1", name: "Harish Nampally", email: "nampallyharish5544@gmail.com", password: "Harish81870Nampally", phone: "+919876543210", role: "admin" as const, isActive: true },
  ];

  console.log("Seeding users...");
  for (const user of usersData) {
    await db.insert(users).values(user).onConflictDoNothing();
  }

  // Seed Menu Categories
  const categoriesData = [
    { visibleId: "cat-1", name: "Biryani", description: "Aromatic rice dishes", sortOrder: 1, isActive: true },
    { visibleId: "cat-2", name: "Starters", description: "Appetizers and snacks", sortOrder: 2, isActive: true },
    { visibleId: "cat-3", name: "Main Course", description: "Main dishes", sortOrder: 3, isActive: true },
    { visibleId: "cat-4", name: "Breads", description: "Indian breads", sortOrder: 4, isActive: true },
    { visibleId: "cat-5", name: "Beverages", description: "Drinks and refreshments", sortOrder: 5, isActive: true },
    { visibleId: "cat-6", name: "Desserts", description: "Sweet treats", sortOrder: 6, isActive: true },
  ];

  console.log("Seeding categories...");
  for (const category of categoriesData) {
    await db.insert(menuCategories).values(category).onConflictDoNothing();
  }

  // Get category IDs
  const cats = await db.select().from(menuCategories);
  const catMap = new Map(cats.map(c => [c.visibleId, c.id]));

  // Seed Menu Items
  const menuItemsData = [
    // Biryani
    { visibleId: "item-1", categoryId: catMap.get("cat-1")!, name: "Chicken Biryani", description: "Aromatic basmati rice with tender chicken", price: 280, isVeg: false, isAvailable: true, addOns: [], sortOrder: 1 },
    { visibleId: "item-2", categoryId: catMap.get("cat-1")!, name: "Veg Biryani", description: "Fragrant rice with mixed vegetables", price: 220, isVeg: true, isAvailable: true, addOns: [], sortOrder: 2 },
    { visibleId: "item-3", categoryId: catMap.get("cat-1")!, name: "Mutton Biryani", description: "Rich biryani with succulent mutton", price: 350, isVeg: false, isAvailable: true, addOns: [], sortOrder: 3 },
    { visibleId: "item-4", categoryId: catMap.get("cat-1")!, name: "Egg Biryani", description: "Flavorful rice with boiled eggs", price: 200, isVeg: false, isAvailable: true, addOns: [], sortOrder: 4 },
    // Starters
    { visibleId: "item-5", categoryId: catMap.get("cat-2")!, name: "Chicken 65", description: "Spicy deep-fried chicken", price: 220, isVeg: false, isAvailable: true, addOns: [], sortOrder: 1 },
    { visibleId: "item-6", categoryId: catMap.get("cat-2")!, name: "Paneer 65", description: "Crispy fried paneer cubes", price: 200, isVeg: true, isAvailable: true, addOns: [], sortOrder: 2 },
    { visibleId: "item-7", categoryId: catMap.get("cat-2")!, name: "Gobi Manchurian", description: "Indo-Chinese cauliflower", price: 180, isVeg: true, isAvailable: true, addOns: [], sortOrder: 3 },
    { visibleId: "item-8", categoryId: catMap.get("cat-2")!, name: "Chicken Manchurian", description: "Indo-Chinese chicken balls", price: 240, isVeg: false, isAvailable: true, addOns: [], sortOrder: 4 },
    // Main Course
    { visibleId: "item-9", categoryId: catMap.get("cat-3")!, name: "Butter Chicken", description: "Creamy tomato-based chicken curry", price: 300, isVeg: false, isAvailable: true, addOns: [], sortOrder: 1 },
    { visibleId: "item-10", categoryId: catMap.get("cat-3")!, name: "Paneer Butter Masala", description: "Rich paneer curry", price: 260, isVeg: true, isAvailable: true, addOns: [], sortOrder: 2 },
    { visibleId: "item-11", categoryId: catMap.get("cat-3")!, name: "Dal Fry", description: "Tempered yellow lentils", price: 150, isVeg: true, isAvailable: true, addOns: [], sortOrder: 3 },
    { visibleId: "item-12", categoryId: catMap.get("cat-3")!, name: "Palak Paneer", description: "Paneer in spinach gravy", price: 240, isVeg: true, isAvailable: true, addOns: [], sortOrder: 4 },
    // Breads
    { visibleId: "item-13", categoryId: catMap.get("cat-4")!, name: "Garlic Naan", description: "Leavened bread with garlic", price: 60, isVeg: true, isAvailable: true, addOns: [], sortOrder: 1 },
    { visibleId: "item-14", categoryId: catMap.get("cat-4")!, name: "Butter Roti", description: "Whole wheat bread with butter", price: 40, isVeg: true, isAvailable: true, addOns: [], sortOrder: 2 },
    { visibleId: "item-15", categoryId: catMap.get("cat-4")!, name: "Tandoori Roti", description: "Clay oven baked bread", price: 35, isVeg: true, isAvailable: true, addOns: [], sortOrder: 3 },
    // Beverages
    { visibleId: "item-16", categoryId: catMap.get("cat-5")!, name: "Mango Lassi", description: "Sweet mango yogurt drink", price: 80, isVeg: true, isAvailable: true, addOns: [], sortOrder: 1 },
    { visibleId: "item-17", categoryId: catMap.get("cat-5")!, name: "Masala Chai", description: "Spiced Indian tea", price: 40, isVeg: true, isAvailable: true, addOns: [], sortOrder: 2 },
    // Desserts
    { visibleId: "item-18", categoryId: catMap.get("cat-6")!, name: "Gulab Jamun", description: "Sweet milk dumplings", price: 80, isVeg: true, isAvailable: true, addOns: [], sortOrder: 1 },
    { visibleId: "item-19", categoryId: catMap.get("cat-6")!, name: "Raita", description: "Yogurt with spices", price: 60, isVeg: true, isAvailable: true, addOns: [], sortOrder: 2 },
  ];

  console.log("Seeding menu items...");
  for (const item of menuItemsData) {
    await db.insert(menuItems).values(item).onConflictDoNothing();
  }

  // Seed Tables
  const tablesData = [
    // Large Tables (capacity 6)
    { visibleId: "table-1", tableNumber: "T1", capacity: 6, floor: "Large Tables", status: "available" as const },
    { visibleId: "table-2", tableNumber: "T2", capacity: 6, floor: "Large Tables", status: "available" as const },
    { visibleId: "table-3", tableNumber: "T3", capacity: 6, floor: "Large Tables", status: "available" as const },
    // Small Tables (capacity 4)
    { visibleId: "table-4", tableNumber: "T4", capacity: 4, floor: "Small Tables", status: "available" as const },
    { visibleId: "table-5", tableNumber: "T5", capacity: 4, floor: "Small Tables", status: "available" as const },
    { visibleId: "table-6", tableNumber: "T6", capacity: 4, floor: "Small Tables", status: "available" as const },
    { visibleId: "table-7", tableNumber: "T7", capacity: 4, floor: "Small Tables", status: "available" as const },
    { visibleId: "table-8", tableNumber: "T8", capacity: 4, floor: "Small Tables", status: "available" as const },
    { visibleId: "table-9", tableNumber: "T9", capacity: 4, floor: "Small Tables", status: "available" as const },
    // Family Section
    { visibleId: "table-f1", tableNumber: "F1", capacity: 4, floor: "Family Section", status: "available" as const },
    { visibleId: "table-f2", tableNumber: "F2", capacity: 4, floor: "Family Section", status: "available" as const },
  ];

  console.log("Seeding tables...");
  for (const table of tablesData) {
    await db.insert(tables).values(table).onConflictDoNothing();
  }

  console.log("Seeding completed!");
  await pool.end();
}

seed().catch(console.error);
