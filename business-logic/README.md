
**Laboratory 3: Systems on Business Logic**
ITSAR2 313 – System Integration and Architecture 2


##  Members

- BOMBATE, RIZZA
- ENGRACIAL, QUENNIE
- IGNALAGUE, RODNEY
- REBLANDO, ANTON
- SAUSA, EDEN CARL




# Product Ordering API

A simple REST API demonstrating **business logic validation** in a product ordering system. This project is designed as a university lab exercise to help students understand how to implement and enforce business rules in web applications.

## System Overview

This API simulates a basic e-commerce ordering system where:
- Products are stored in a **SQLite database**
- Products have an ID, name, price, and stock quantity
- Users can view available products
- Users can place orders (which deducts stock)
- Business rules validate all orders before processing

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Navigate to the project directory:
   ```bash
   cd business-logic
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

Start the API server:
```bash
node server.js
```

The server will start on `http://localhost:3000`

On first run, the SQLite database (`products.db`) will be created and seeded with initial product data automatically.


**Initial Data:**
| id | name | price | stock |
|----|------|-------|-------|
| 1 | Wireless Mouse | 29.99 | 50 |
| 2 | USB Keyboard | 49.99 | 30 |
| 3 | HDMI Cable | 12.99 | 100 |
| 4 | Webcam HD | 79.99 | 15 |

---

## API Endpoints

### 1. GET /products

Returns the full list of available products.

**Response:** Array of product objects

```json
[
  { "id": 1, "name": "Wireless Mouse", "price": 29.99, "stock": 50 },
  { "id": 2, "name": "USB Keyboard", "price": 49.99, "stock": 30 },
  ...
]
```

---

### 2. POST /order

Processes a product order with business logic validation.

**Request Body:**
```json
{
  "productId": <number>,
  "quantity": <number>
}
```

**Business Rules Enforced:**
| Rule | Condition | Error Response |
|------|-----------|----------------|
| 1 | Product must exist | `Product with ID X not found` |
| 2 | Quantity must be > 0 | `Quantity must be greater than 0` |
| 3 | Quantity cannot be zero | `Quantity must be greater than 0` |
| 4 | Quantity cannot be negative | `Quantity must be greater than 0` |
| 5 | Quantity must not exceed stock | `Insufficient stock. Available: X, Requested: Y` |


**Success Response (200):**
```json
{
  "message": "Order successful",
  "product": "<product name>",
  "remainingStock": <number>
}
```

**Error Response (400/404):**
```json
{
  "error": "<error description>"
}
```

---

### 3. POST /reset

Resets all product stock to initial values. Useful for testing.

**Response:**
```json
{
  "message": "Stock reset to initial values"
}
```

---


### curl Command Syntax

```
curl [options] <URL>
```

**Common options used in this lab:**
| Option | Description | Example |
|--------|-------------|---------|
| `-X` | Specifies the HTTP method | `-X POST` (use POST method) |
| `-H` | Adds a header to the request | `-H "Content-Type: application/json"` |
| `-d` | Sends data in the request body | `-d "{\"key\": \"value\"}"` |
| `-s` | Silent mode (hides progress) | `curl -s http://...` |

> **Windows CMD Note:** Use double quotes (`"`) for the outer string and escape inner quotes with backslash (`\"`).

---

### Test Commands

Below are curl commands to test all API functionality and business rules.

### Test 1: Get All Products

```cmd
  curl http://localhost:3000/products
```

Expected: Returns array of all products with their current stock levels.

---

### Test 2: Valid Order (Success Case)

```cmd
curl -X POST http://localhost:3000/order -H "Content-Type: application/json" -d "{\"productId\": 1, \"quantity\": 2}"
```

Expected: Order succeeds, stock is deducted.
```json
{
  "message": "Order successful",
  "product": "Wireless Mouse",
  "remainingStock": 48
}
```

---

### Test 3: Invalid Product ID

```cmd
curl -X POST http://localhost:3000/order -H "Content-Type: application/json" -d "{\"productId\": 999, \"quantity\": 1}"
```

Expected: Error - product not found.
```json
{
  "error": "Product with ID 999 not found"
}
```

---

### Test 4: Quantity = 0

```cmd
curl -X POST http://localhost:3000/order -H "Content-Type: application/json" -d "{\"productId\": 1, \"quantity\": 0}"
```

Expected: Error - quantity must be greater than 0.
```json
{
  "error": "Quantity must be greater than 0"
}
```

---

### Test 5: Negative Quantity

```cmd
curl -X POST http://localhost:3000/order -H "Content-Type: application/json" -d "{\"productId\": 1, \"quantity\": -5}"
```

Expected: Error - quantity must be greater than 0.
```json
{
  "error": "Quantity must be greater than 0"
}
```

---

### Test 6: Stock Exceeded

```cmd
curl -X POST http://localhost:3000/order -H "Content-Type: application/json" -d "{\"productId\": 4, \"quantity\": 1000}"
```

Expected: Error - insufficient stock.
```json
{
  "error": "Insufficient stock. Available: 15, Requested: 1000"
}
```

---

### Test 7: Reset Stock

```cmd
curl -X POST http://localhost:3000/reset
```

Expected: Stock reset confirmation.
```json
{
  "message": "Stock reset to initial values"
}
```

---

## Project Structure

```
business-logic/
├── server.js        # Main API server with Express + SQLite
├── products.db      # SQLite database (auto-created on first run)
├── products.json    # Reference data (not used by server)
├── README.md        # This documentation file
├── package.json     # Node.js dependencies
└── node_modules/    # Installed packages
```

## Viewing the Database

You can inspect the SQLite database using the `sqlite3` command-line tool:

```bash
# Open the database
sqlite3 products.db

# View all products
SELECT * FROM products;

# Check specific product stock
SELECT name, stock FROM products WHERE id = 1;

# Exit
.quit
```

Or use a GUI tool like [DB Browser for SQLite](https://sqlitebrowser.org/).

## Resetting the Database

**Option 1:** Use the API endpoint:
```cmd
curl -X POST http://localhost:3000/reset
```

**Option 2:** Delete the database file and restart the server:
```cmd
del products.db
node server.js
```

---


