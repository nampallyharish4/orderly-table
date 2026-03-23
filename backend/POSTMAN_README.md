# Postman API Testing Guide

This document outlines the REST API endpoints available in the Kaveri POS Backend for testing via Postman.

**Base URL:**
All endpoints are relative to the base server URL. Assuming you are running the Spring Boot backend locally, the base URL is:
`http://localhost:8080`

---

## 🔐 1. Authentication Endpoints

### Login
* **Method:** `POST`
* **URL:** `/api/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "email": "nampallyharish5544@gmail.com",
    "password": "Harish81870Nampally"
  }
  ```
* **Response:** Returns the user object if successful (including role, name, visible id, etc.).

---

## 🍔 2. Menu Categories & Items

### Get All Menu Categories
* **Method:** `GET`
* **URL:** `/api/categories`

### Get All Menu Items
* **Method:** `GET`
* **URL:** `/api/menu-items`

### Create a New Menu Item
* **Method:** `POST`
* **URL:** `/api/menu-items`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "categoryId": "cat-1",
    "name": "New Postman Item",
    "description": "Created from Postman",
    "price": 150.00,
    "isVeg": true,
    "isAvailable": true,
    "preparationTime": 15
  }
  ```

### Update a Menu Item
* **Method:** `PATCH`
* **URL:** `/api/menu-items/{visible_id}` (e.g., `/api/menu-items/item-1`)
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "price": 180.00,
    "isAvailable": false
  }
  ```

### Delete a Menu Item
* **Method:** `DELETE`
* **URL:** `/api/menu-items/{visible_id}` (e.g., `/api/menu-items/item-1`)

---

## 🪑 3. Table Management

### Get All Tables
* **Method:** `GET`
* **URL:** `/api/tables`

### Update Table Status
* **Method:** `PATCH`
* **URL:** `/api/tables/{visible_id}` (e.g., `/api/tables/table-1`)
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "status": "occupied",
    "currentOrderIds": ["order-12345"]
  }
  ```

---

## 📝 4. Order Management

*(Assuming standard CRUD REST mappings for `OrderController.java`)*

### Get All Orders
* **Method:** `GET`
* **URL:** `/api/orders`

### Create a New Order
* **Method:** `POST`
* **URL:** `/api/orders`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):** *(Example payload configuration based on standard systems)*
  ```json
  {
    "tableId": "table-1",
    "customerName": "John Doe",
    "items": [
      {
        "menuItemId": "item-1",
        "quantity": 2,
        "price": 280
      }
    ],
    "subtotal": 560,
    "tax": 28,
    "total": 588,
    "status": "in_progress"
  }
  ```

### Update Order Status
* **Method:** `PATCH`
* **URL:** `/api/orders/{visible_id}`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
  ```json
  {
    "status": "completed"
  }
  ```

---

## ⚙️ 5. Setting Management & Users

### Get All Users
* **Method:** `GET`
* **URL:** `/api/users`

### Get Application Settings
* **Method:** `GET`
* **URL:** `/api/settings`


---

## 🚀 Pro Tips for Postman:
1. Setup a **Collection** named `Kaveri POS`.
2. Add a **Collection Variable** called `{{base_url}}` set to `http://localhost:8080`.
3. Save your endpoints using `{{base_url}}/api/auth/login` instead of hardcoding `localhost:8080`. This helps if you eventually publish your Spring Boot backend to a cloud provider!
