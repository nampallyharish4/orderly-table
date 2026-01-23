import { Express, Request, Response } from 'express';
import { db } from './db.js';
import * as schema from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const { orders, tables, menuItems, menuCategories, users, settings } = schema;

const seedCategories = [
  { visibleId: 'cat-1', name: 'Biryani (Non Veg)', description: 'Authentic dum biryanis', sortOrder: 1, isActive: true },
  { visibleId: 'cat-2', name: 'Biryani Family Packs', description: 'Large packs for family', sortOrder: 2, isActive: true },
  { visibleId: 'cat-3', name: 'Biryani (Veg)', description: 'Vegetarian biryanis', sortOrder: 3, isActive: true },
  { visibleId: 'cat-4', name: 'Veg Starters', description: 'Vegetarian appetizers', sortOrder: 4, isActive: true },
  { visibleId: 'cat-5', name: 'Non Veg Starters', description: 'Chicken starters and appetizers', sortOrder: 5, isActive: true },
  { visibleId: 'cat-6', name: 'Indian Non Veg Curries', description: 'Authentic Indian curry dishes', sortOrder: 6, isActive: true },
  { visibleId: 'cat-7', name: 'Veg Curries', description: 'Vegetarian Indian curry dishes', sortOrder: 7, isActive: true },
  { visibleId: 'cat-8', name: 'Tandoori Rotis', description: 'Fresh tandoor-baked breads', sortOrder: 8, isActive: true },
  { visibleId: 'cat-9', name: 'Tandoori Non Veg', description: 'Tandoor-cooked chicken items', sortOrder: 9, isActive: true },
  { visibleId: 'cat-10', name: 'Veg Rice', description: 'Vegetarian rice dishes', sortOrder: 10, isActive: true },
  { visibleId: 'cat-11', name: 'Non Veg Rice', description: 'Non-vegetarian rice dishes', sortOrder: 11, isActive: true },
];

const seedItems = [
  { visibleId: 'item-1', categoryVisibleId: 'cat-1', name: 'Chicken Dum Biryani (Single)', description: 'Classic chicken dum biryani with aromatic spices', price: 150, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 1 },
  { visibleId: 'item-2', categoryVisibleId: 'cat-1', name: 'Chicken Dum Biryani (Full)', description: 'Classic chicken dum biryani with aromatic spices', price: 220, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 2 },
  { visibleId: 'item-3', categoryVisibleId: 'cat-1', name: 'Chicken Fry Biryani (Single)', description: 'Biryani with crispy fried chicken pieces', price: 160, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 3 },
  { visibleId: 'item-4', categoryVisibleId: 'cat-1', name: 'Chicken Fry Biryani (Full)', description: 'Biryani with crispy fried chicken pieces', price: 230, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 4 },
  { visibleId: 'item-5', categoryVisibleId: 'cat-1', name: 'Egg Biryani', description: 'Flavorful biryani with boiled eggs', price: 140, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 5 },
  { visibleId: 'item-6', categoryVisibleId: 'cat-1', name: 'Fish Biryani (Single)', description: 'Aromatic biryani with fresh fish', price: 180, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 6 },
  { visibleId: 'item-7', categoryVisibleId: 'cat-1', name: 'Fish Biryani (Full)', description: 'Aromatic biryani with fresh fish', price: 300, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 7 },
  { visibleId: 'item-8', categoryVisibleId: 'cat-1', name: 'Boneless Chicken Biryani (Single)', description: 'Biryani with tender boneless chicken', price: 200, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 8 },
  { visibleId: 'item-9', categoryVisibleId: 'cat-1', name: 'Boneless Chicken Biryani (Full)', description: 'Biryani with tender boneless chicken', price: 320, isVeg: false, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 9 },
  { visibleId: 'item-10', categoryVisibleId: 'cat-2', name: 'Chicken Dum Biryani (Family Pack)', description: 'Family size chicken dum biryani', price: 550, isVeg: false, isAvailable: true, addOns: [], preparationTime: 35, sortOrder: 1 },
  { visibleId: 'item-11', categoryVisibleId: 'cat-2', name: 'Chicken Dum Biryani (Jumbo Pack)', description: 'Jumbo size chicken dum biryani for parties', price: 750, isVeg: false, isAvailable: true, addOns: [], preparationTime: 45, sortOrder: 2 },
  { visibleId: 'item-12', categoryVisibleId: 'cat-2', name: 'Chicken Fry Biryani (Family Pack)', description: 'Family size chicken fry biryani', price: 650, isVeg: false, isAvailable: true, addOns: [], preparationTime: 35, sortOrder: 3 },
  { visibleId: 'item-13', categoryVisibleId: 'cat-2', name: 'Chicken Fry Biryani (Jumbo Pack)', description: 'Jumbo size chicken fry biryani for parties', price: 750, isVeg: false, isAvailable: true, addOns: [], preparationTime: 45, sortOrder: 4 },
  { visibleId: 'item-14', categoryVisibleId: 'cat-3', name: 'Veg Biryani (Single)', description: 'Aromatic vegetable biryani with fresh vegetables', price: 140, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 1 },
  { visibleId: 'item-15', categoryVisibleId: 'cat-3', name: 'Veg Biryani (Full)', description: 'Aromatic vegetable biryani with fresh vegetables', price: 250, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 2 },
  { visibleId: 'item-16', categoryVisibleId: 'cat-3', name: 'Paneer Biryani (Single)', description: 'Rich biryani with soft paneer cubes', price: 220, isVeg: true, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 3 },
  { visibleId: 'item-17', categoryVisibleId: 'cat-3', name: 'Paneer Biryani (Full)', description: 'Rich biryani with soft paneer cubes', price: 340, isVeg: true, isAvailable: true, addOns: [], preparationTime: 25, sortOrder: 4 },
  { visibleId: 'item-18', categoryVisibleId: 'cat-3', name: 'Biryani Rice', description: 'Flavorful biryani rice without any protein', price: 120, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 5 },
  { visibleId: 'item-19', categoryVisibleId: 'cat-4', name: 'Veg Manchuria', description: 'Crispy vegetable balls in tangy manchurian sauce', price: 140, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 1 },
  { visibleId: 'item-20', categoryVisibleId: 'cat-4', name: 'Gobi Manchuria', description: 'Crispy cauliflower florets in spicy manchurian sauce', price: 140, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 2 },
  { visibleId: 'item-21', categoryVisibleId: 'cat-4', name: 'Paneer 65', description: 'Spicy deep-fried paneer with aromatic spices', price: 210, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 3 },
  { visibleId: 'item-22', categoryVisibleId: 'cat-5', name: 'Chicken Manchuria (Single)', description: 'Crispy chicken balls in tangy manchurian sauce', price: 220, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 1 },
  { visibleId: 'item-23', categoryVisibleId: 'cat-5', name: 'Chicken Manchuria (Full)', description: 'Crispy chicken balls in tangy manchurian sauce', price: 380, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 2 },
  { visibleId: 'item-24', categoryVisibleId: 'cat-5', name: 'Chicken 65 (Single)', description: 'Spicy deep-fried chicken with aromatic spices', price: 239, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 3 },
  { visibleId: 'item-25', categoryVisibleId: 'cat-5', name: 'Chicken 65 (Full)', description: 'Spicy deep-fried chicken with aromatic spices', price: 500, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 4 },
  { visibleId: 'item-26', categoryVisibleId: 'cat-5', name: 'Chickens Majestic (Single)', description: 'Crispy chicken tossed with curry leaves and spices', price: 239, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 5 },
  { visibleId: 'item-27', categoryVisibleId: 'cat-5', name: 'Chickens Majestic (Full)', description: 'Crispy chicken tossed with curry leaves and spices', price: 500, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 6 },
  { visibleId: 'item-28', categoryVisibleId: 'cat-5', name: 'Chicken 555 (Single)', description: 'Spicy crispy chicken with special 555 masala', price: 239, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 7 },
  { visibleId: 'item-29', categoryVisibleId: 'cat-5', name: 'Chicken 555 (Full)', description: 'Spicy crispy chicken with special 555 masala', price: 500, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 8 },
  { visibleId: 'item-30', categoryVisibleId: 'cat-5', name: 'Dragon Chicken (Single)', description: 'Crispy chicken in spicy dragon sauce', price: 239, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 9 },
  { visibleId: 'item-31', categoryVisibleId: 'cat-5', name: 'Dragon Chicken (Full)', description: 'Crispy chicken in spicy dragon sauce', price: 500, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 10 },
  { visibleId: 'item-32', categoryVisibleId: 'cat-5', name: 'Kaju Chicken (Single)', description: 'Chicken with cashew nuts in rich gravy', price: 249, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 11 },
  { visibleId: 'item-33', categoryVisibleId: 'cat-5', name: 'Kaju Chicken (Full)', description: 'Chicken with cashew nuts in rich gravy', price: 510, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 12 },
  { visibleId: 'item-34', categoryVisibleId: 'cat-5', name: 'Chicken Fry (Single)', description: 'Crispy fried chicken with special spices', price: 180, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 13 },
  { visibleId: 'item-35', categoryVisibleId: 'cat-5', name: 'Chicken Fry (Full)', description: 'Crispy fried chicken with special spices', price: 280, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 14 },
  { visibleId: 'item-36', categoryVisibleId: 'cat-5', name: 'Chilli Chicken (Single)', description: 'Indo-Chinese style chicken with green chilies', price: 239, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 15 },
  { visibleId: 'item-37', categoryVisibleId: 'cat-5', name: 'Chilli Chicken (Full)', description: 'Indo-Chinese style chicken with green chilies', price: 500, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 16 },
  { visibleId: 'item-38', categoryVisibleId: 'cat-6', name: 'Butter Chicken (Single)', description: 'Creamy tomato-based chicken curry with butter', price: 249, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 1 },
  { visibleId: 'item-39', categoryVisibleId: 'cat-6', name: 'Butter Chicken (Full)', description: 'Creamy tomato-based chicken curry with butter', price: 400, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 2 },
  { visibleId: 'item-40', categoryVisibleId: 'cat-6', name: 'Chicken Masala Bone (Single)', description: 'Spicy chicken curry with bone-in pieces', price: 200, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 3 },
  { visibleId: 'item-41', categoryVisibleId: 'cat-6', name: 'Chicken Masala Bone (Full)', description: 'Spicy chicken curry with bone-in pieces', price: 380, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 4 },
  { visibleId: 'item-42', categoryVisibleId: 'cat-6', name: 'Chicken Tikka Masala (Single)', description: 'Grilled chicken tikka in rich masala gravy', price: 249, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 5 },
  { visibleId: 'item-43', categoryVisibleId: 'cat-6', name: 'Chicken Tikka Masala (Full)', description: 'Grilled chicken tikka in rich masala gravy', price: 400, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 6 },
  { visibleId: 'item-44', categoryVisibleId: 'cat-6', name: 'Kadai Chicken (Single)', description: 'Chicken cooked with bell peppers in kadai style', price: 249, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 7 },
  { visibleId: 'item-45', categoryVisibleId: 'cat-6', name: 'Kadai Chicken (Full)', description: 'Chicken cooked with bell peppers in kadai style', price: 400, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 8 },
  { visibleId: 'item-47', categoryVisibleId: 'cat-6', name: 'Egg Masala', description: 'Boiled eggs in flavorful onion-tomato masala gravy', price: 140, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 10 },
  { visibleId: 'item-48', categoryVisibleId: 'cat-6', name: 'Egg Burji', description: 'Scrambled eggs with onions and Indian spices', price: 140, isVeg: false, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 11 },
  { visibleId: 'item-49', categoryVisibleId: 'cat-7', name: 'Tomato Curry', description: 'Tangy tomato-based curry with Indian spices', price: 130, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 1 },
  { visibleId: 'item-50', categoryVisibleId: 'cat-7', name: 'Dal Fry', description: 'Tempered yellow lentils with cumin and garlic', price: 120, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 2 },
  { visibleId: 'item-51', categoryVisibleId: 'cat-7', name: 'Mixed Veg Curry (Single)', description: 'Assorted vegetables in rich masala gravy', price: 180, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 3 },
  { visibleId: 'item-52', categoryVisibleId: 'cat-7', name: 'Mixed Veg Curry (Full)', description: 'Assorted vegetables in rich masala gravy', price: 250, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 4 },
  { visibleId: 'item-53', categoryVisibleId: 'cat-7', name: 'Palak Paneer (Single)', description: 'Cottage cheese cubes in creamy spinach gravy', price: 180, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 5 },
  { visibleId: 'item-54', categoryVisibleId: 'cat-7', name: 'Palak Paneer (Full)', description: 'Cottage cheese cubes in creamy spinach gravy', price: 300, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 6 },
  { visibleId: 'item-55', categoryVisibleId: 'cat-7', name: 'Paneer Butter Masala (Single)', description: 'Paneer in rich tomato and butter gravy', price: 180, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 7 },
  { visibleId: 'item-56', categoryVisibleId: 'cat-7', name: 'Paneer Butter Masala (Full)', description: 'Paneer in rich tomato and butter gravy', price: 300, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 8 },
  { visibleId: 'item-57', categoryVisibleId: 'cat-7', name: 'Kaju Tomato (Single)', description: 'Cashews in tangy tomato-based curry', price: 200, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 9 },
  { visibleId: 'item-58', categoryVisibleId: 'cat-7', name: 'Kaju Tomato (Full)', description: 'Cashews in tangy tomato-based curry', price: 340, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 10 },
  { visibleId: 'item-59', categoryVisibleId: 'cat-7', name: 'Kaju Paneer (Single)', description: 'Cashews and paneer in creamy gravy', price: 220, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 11 },
  { visibleId: 'item-60', categoryVisibleId: 'cat-7', name: 'Kaju Paneer (Full)', description: 'Cashews and paneer in creamy gravy', price: 350, isVeg: true, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 12 },
  { visibleId: 'item-61', categoryVisibleId: 'cat-8', name: 'Plain Naan', description: 'Traditional leavened bread baked in tandoor', price: 40, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 1 },
  { visibleId: 'item-62', categoryVisibleId: 'cat-8', name: 'Butter Naan', description: 'Soft naan brushed with butter', price: 50, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 2 },
  { visibleId: 'item-63', categoryVisibleId: 'cat-8', name: 'Garlic Naan', description: 'Naan topped with garlic and herbs', price: 60, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 3 },
  { visibleId: 'item-64', categoryVisibleId: 'cat-8', name: 'Tandoori Roti', description: 'Whole wheat bread baked in tandoor', price: 30, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 4 },
  { visibleId: 'item-65', categoryVisibleId: 'cat-8', name: 'Butter Roti', description: 'Tandoori roti with butter', price: 35, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 5 },
  { visibleId: 'item-66', categoryVisibleId: 'cat-8', name: 'Rumali Roti', description: 'Thin handkerchief-like bread', price: 40, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 6 },
  { visibleId: 'item-67', categoryVisibleId: 'cat-8', name: 'Kulcha', description: 'Stuffed leavened bread', price: 50, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 7 },
  { visibleId: 'item-68', categoryVisibleId: 'cat-8', name: 'Laccha Paratha', description: 'Layered flaky bread', price: 50, isVeg: true, isAvailable: true, addOns: [], preparationTime: 10, sortOrder: 8 },
  { visibleId: 'item-70', categoryVisibleId: 'cat-9', name: 'Tandoori Chicken (Half)', description: 'Half chicken marinated and cooked in tandoor', price: 280, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 1 },
  { visibleId: 'item-71', categoryVisibleId: 'cat-9', name: 'Tandoori Chicken (Full)', description: 'Full chicken marinated and cooked in tandoor', price: 480, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 2 },
  { visibleId: 'item-72', categoryVisibleId: 'cat-9', name: 'Tangdi Kabab (2p)', description: 'Spiced chicken drumsticks cooked in tandoor', price: 180, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 3 },
  { visibleId: 'item-73', categoryVisibleId: 'cat-9', name: 'Tangdi Kabab (4p)', description: 'Spiced chicken drumsticks cooked in tandoor', price: 360, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 4 },
  { visibleId: 'item-74', categoryVisibleId: 'cat-9', name: 'Chicken Tikka (5p)', description: 'Boneless chicken pieces marinated and grilled in tandoor', price: 280, isVeg: false, isAvailable: true, addOns: [], preparationTime: 20, sortOrder: 5 },
  { visibleId: 'item-75', categoryVisibleId: 'cat-10', name: 'Jeera Rice', description: 'Fragrant basmati rice tempered with cumin seeds', price: 160, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 1 },
  { visibleId: 'item-76', categoryVisibleId: 'cat-10', name: 'Veg Fried Rice', description: 'Stir-fried rice with mixed vegetables', price: 160, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 2 },
  { visibleId: 'item-77', categoryVisibleId: 'cat-10', name: 'Tomato Rice', description: 'Tangy rice cooked with tomatoes and spices', price: 140, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 3 },
  { visibleId: 'item-78', categoryVisibleId: 'cat-10', name: 'Pudina Rice', description: 'Aromatic rice with fresh mint leaves', price: 150, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 4 },
  { visibleId: 'item-79', categoryVisibleId: 'cat-10', name: 'Paneer Fried Rice', description: 'Fried rice with paneer cubes and vegetables', price: 180, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 5 },
  { visibleId: 'item-80', categoryVisibleId: 'cat-10', name: 'Kaju Fried Rice', description: 'Fried rice with cashew nuts', price: 200, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 6 },
  { visibleId: 'item-81', categoryVisibleId: 'cat-10', name: 'Kaju Paneer Fried Rice', description: 'Fried rice with cashews and paneer', price: 240, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 7 },
  { visibleId: 'item-82', categoryVisibleId: 'cat-10', name: 'Veg Manchurian Rice', description: 'Fried rice topped with veg manchurian', price: 170, isVeg: true, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 8 },
  { visibleId: 'item-83', categoryVisibleId: 'cat-11', name: 'Egg Fried Rice', description: 'Fried rice with scrambled eggs', price: 180, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 1 },
  { visibleId: 'item-84', categoryVisibleId: 'cat-11', name: 'Chicken Fried Rice', description: 'Fried rice with chicken pieces', price: 210, isVeg: false, isAvailable: true, addOns: [], preparationTime: 15, sortOrder: 2 },
];

const seedTables = [
  { visibleId: 'table-1', tableNumber: 'T1', capacity: 6, floor: 'Large Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-2', tableNumber: 'T2', capacity: 6, floor: 'Large Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-3', tableNumber: 'T3', capacity: 6, floor: 'Large Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-4', tableNumber: 'T4', capacity: 4, floor: 'Small Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-5', tableNumber: 'T5', capacity: 4, floor: 'Small Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-6', tableNumber: 'T6', capacity: 4, floor: 'Small Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-7', tableNumber: 'T7', capacity: 4, floor: 'Small Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-8', tableNumber: 'T8', capacity: 4, floor: 'Small Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-9', tableNumber: 'T9', capacity: 4, floor: 'Small Tables', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-10', tableNumber: 'F1', capacity: 4, floor: 'Family Section', status: 'available' as const, currentOrderIds: [] },
  { visibleId: 'table-11', tableNumber: 'F2', capacity: 4, floor: 'Family Section', status: 'available' as const, currentOrderIds: [] },
];

const seedUsers = [
  { visibleId: 'user-1', name: 'Harish Nampally', email: 'nampallyharish5544@gmail.com', password: 'Harish81870Nampally', phone: '+919876543210', role: 'admin' as const, isActive: true },
];

export function registerRoutes(app: Express) {
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const formattedOrders = allOrders.map(order => ({
        ...order,
        id: order.visibleId,
        items: order.items as any[],
        payment: order.paymentMethod ? {
          id: `pay-${order.id}`,
          orderId: order.visibleId,
          method: order.paymentMethod,
          amount: order.totalAmount,
          cashAmount: order.cashAmount,
          upiAmount: order.upiAmount,
          status: order.paymentStatus || 'completed',
          paidAt: order.paidAt,
        } : null,
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
      
      let tableIdNum: number | null = null;
      if (orderData.tableId) {
        const tableIdStr = String(orderData.tableId);
        if (tableIdStr.startsWith('table-')) {
          tableIdNum = parseInt(tableIdStr.replace('table-', ''), 10);
        } else {
          tableIdNum = parseInt(tableIdStr, 10);
        }
        if (isNaN(tableIdNum)) tableIdNum = null;
      }
      
      const [newOrder] = await db.insert(orders).values({
        visibleId,
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType,
        tableId: tableIdNum,
        tableNumber: orderData.tableNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        items: orderData.items || [],
        subtotal: parseFloat(orderData.subtotal) || 0,
        taxAmount: parseFloat(orderData.taxAmount) || 0,
        serviceCharge: parseFloat(orderData.serviceCharge) || 0,
        discountAmount: parseFloat(orderData.discountAmount) || 0,
        totalAmount: parseFloat(orderData.totalAmount) || 0,
        status: orderData.status || 'new',
        notes: orderData.notes,
        createdBy: orderData.createdBy || 'system',
      }).returning();

      res.json({ ...newOrder, id: newOrder.visibleId });
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order', details: error?.message });
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
      if (updates.cashAmount !== undefined) updateData.cashAmount = updates.cashAmount;
      if (updates.upiAmount !== undefined) updateData.upiAmount = updates.upiAmount;
      if (updates.paidAt !== undefined) updateData.paidAt = new Date(updates.paidAt);
      if (updates.servedAt !== undefined) updateData.servedAt = new Date(updates.servedAt);
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
      if (updates.taxAmount !== undefined) updateData.taxAmount = updates.taxAmount;
      if (updates.serviceCharge !== undefined) updateData.serviceCharge = updates.serviceCharge;
      if (updates.discountAmount !== undefined) updateData.discountAmount = updates.discountAmount;
      if (updates.totalAmount !== undefined) updateData.totalAmount = updates.totalAmount;
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
      const { status, currentOrderIds } = req.body;
      
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (currentOrderIds !== undefined) updateData.currentOrderIds = currentOrderIds;
      
      const [updatedTable] = await db
        .update(tables)
        .set(updateData)
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

  app.post('/api/menu-items', async (req: Request, res: Response) => {
    try {
      const itemData = req.body;
      const visibleId = `item-${Date.now()}`;
      
      const allCategories = await db.select().from(menuCategories);
      const category = allCategories.find(c => c.visibleId === itemData.categoryId);
      
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      const [newItem] = await db.insert(menuItems).values({
        visibleId,
        categoryId: category.id,
        name: itemData.name,
        description: itemData.description || '',
        price: itemData.price,
        isVeg: itemData.isVeg || false,
        isAvailable: itemData.isAvailable !== false,
        addOns: [],
        preparationTime: itemData.preparationTime || 15,
        sortOrder: 0,
        imageUrl: itemData.imageUrl || null,
      }).returning();

      res.json({ ...newItem, id: newItem.visibleId, categoryId: category.visibleId, category: category.name });
    } catch (error) {
      console.error('Error creating menu item:', error);
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  });

  app.patch('/api/menu-items/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.isVeg !== undefined) updateData.isVeg = updates.isVeg;
      if (updates.isAvailable !== undefined) updateData.isAvailable = updates.isAvailable;
      if (updates.preparationTime !== undefined) updateData.preparationTime = updates.preparationTime;
      if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
      
      if (updates.categoryId !== undefined) {
        const allCategories = await db.select().from(menuCategories);
        const category = allCategories.find(c => c.visibleId === updates.categoryId);
        if (category) {
          updateData.categoryId = category.id;
        }
      }

      const [updatedItem] = await db
        .update(menuItems)
        .set(updateData)
        .where(eq(menuItems.visibleId, id))
        .returning();

      if (!updatedItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      res.json({ ...updatedItem, id: updatedItem.visibleId });
    } catch (error) {
      console.error('Error updating menu item:', error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  });

  app.delete('/api/menu-items/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [deleted] = await db
        .delete(menuItems)
        .where(eq(menuItems.visibleId, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      res.json({ success: true, id });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  });

  app.post('/api/seed', async (req: Request, res: Response) => {
    try {
      console.log('Starting database seed via API...');

      const insertedCategories = await db.insert(menuCategories).values(seedCategories).onConflictDoNothing().returning();
      console.log(`Inserted ${insertedCategories.length} categories`);

      const allCategories = await db.select().from(menuCategories);
      const categoryMap = new Map(allCategories.map(c => [c.visibleId, c.id]));

      const menuItemsData = seedItems.map(item => ({
        visibleId: item.visibleId,
        categoryId: categoryMap.get(item.categoryVisibleId) || 1,
        name: item.name,
        description: item.description,
        price: item.price,
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        addOns: item.addOns,
        preparationTime: item.preparationTime,
        sortOrder: item.sortOrder,
      }));

      const insertedItems = await db.insert(menuItems).values(menuItemsData).onConflictDoNothing().returning();
      console.log(`Inserted ${insertedItems.length} menu items`);

      const insertedTables = await db.insert(tables).values(seedTables).onConflictDoNothing().returning();
      console.log(`Inserted ${insertedTables.length} tables`);

      const insertedUsers = await db.insert(users).values(seedUsers).onConflictDoNothing().returning();
      console.log(`Inserted ${insertedUsers.length} users`);

      res.json({ 
        success: true, 
        message: 'Database seeded successfully',
        counts: {
          categories: insertedCategories.length,
          menuItems: insertedItems.length,
          tables: insertedTables.length,
          users: insertedUsers.length
        }
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      res.status(500).json({ error: 'Failed to seed database' });
    }
  });

  // Settings routes
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const allSettings = await db.select().from(settings);
      if (allSettings.length === 0) {
        // Create default settings if none exist
        const [newSettings] = await db.insert(settings).values({}).returning();
        return res.json(newSettings);
      }
      res.json(allSettings[0]);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.patch('/api/settings', async (req: Request, res: Response) => {
    try {
      const allSettings = await db.select().from(settings);
      const updates = {
        ...req.body,
        updatedAt: new Date(),
      };
      
      if (allSettings.length === 0) {
        // Create settings if none exist
        const [newSettings] = await db.insert(settings).values(updates).returning();
        return res.json(newSettings);
      }
      
      const [updated] = await db.update(settings)
        .set(updates)
        .where(eq(settings.id, allSettings[0].id))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Authentication routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, id: user.visibleId });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // User management routes
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users);
      // Return users without passwords
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => ({
        ...user,
        id: user.visibleId,
      }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, role } = req.body;
      
      const visibleId = `user-${Date.now()}`;
      
      const [newUser] = await db.insert(users).values({
        visibleId,
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role,
        isActive: true,
      }).returning();
      
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ ...userWithoutPassword, id: newUser.visibleId });
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  });

  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email.toLowerCase();
      if (updates.password !== undefined) updateData.password = updates.password;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.visibleId, id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ ...userWithoutPassword, id: updatedUser.visibleId });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(users).where(eq(users.visibleId, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });
}
