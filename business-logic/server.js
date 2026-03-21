/**
 * Product Ordering API
 * A simple REST API demonstrating business logic validation
 * Uses SQLite for data persistence
 *
 * University Lab Exercise - Business Logic Module
 */

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Enable pretty-printed JSON responses (2-space indentation)
app.set('json spaces', 2);

// Initialize SQLite database
const DB_PATH = path.join(__dirname, 'products.db');
const db = new Database(DB_PATH);

/**
 * Initialize the database schema and seed data
 * This runs once when the server starts
 */
function initializeDatabase() {
    // Create products table if it doesn't exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0
        )
    `);

    // Check if we need to seed initial data
    const count = db.prepare('SELECT COUNT(*) as count FROM products').get();

    if (count.count === 0) {
        console.log('Seeding initial product data...');

        const insert = db.prepare(
            'INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)'
        );

        // Seed initial products
        const products = [
            [1, 'Wireless Mouse', 29.99, 50],
            [2, 'USB Keyboard', 49.99, 30],
            [3, 'HDMI Cable', 12.99, 100],
            [4, 'Webcam HD', 79.99, 15]
        ];

        // Use a transaction for efficient bulk insert
        const seedProducts = db.transaction((products) => {
            for (const product of products) {
                insert.run(...product);
            }
        });

        seedProducts(products);
        console.log('Database seeded with initial products.');
    }
}

// Initialize database on startup
initializeDatabase();

/**
 * GET /products
 * Returns the full list of available products
 *
 * Response: Array of product objects
 */
app.get('/products', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products').all();
        res.json(products);
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

/**
 * POST /order
 * Processes a product order with business logic validation
 *
 * Request Body:
 *   - productId: number (required) - The ID of the product to order
 *   - quantity: number (required) - The quantity to order
 *
 * Business Rules:
 *   1. Product must exist (invalid ID returns error)
 *   2. Quantity must be greater than 0
 *   3. Quantity must not exceed available stock
 *   4. If valid, deduct quantity from stock
 */
app.post('/order', (req, res) => {
    const { productId, quantity } = req.body;

    // Validate that required fields are provided
    if (productId === undefined || quantity === undefined) {
        return res.status(400).json({
            error: 'Missing required fields: productId and quantity are required'
        });
    }

    // Business Rule 1: Validate quantity is greater than 0
    if (quantity <= 0) {
        return res.status(400).json({
            error: 'Quantity must be greater than 0'
        });
    }

    // Validate quantity is a valid integer
    if (!Number.isInteger(quantity)) {
        return res.status(400).json({
            error: 'Quantity must be a valid integer'
        });
    }

    try {
        // Business Rule 2: Check if product exists
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

        if (!product) {
            return res.status(404).json({
                error: `Product with ID ${productId} not found`
            });
        }

        // Business Rule 3: Check if sufficient stock is available
        if (quantity > product.stock) {
            return res.status(400).json({
                error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
            });
        }

        // All validations passed - Process the order
        // Deduct the ordered quantity from stock using a transaction
        const newStock = product.stock - quantity;

        db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(newStock, productId);

        // Return success response
        res.json({
            message: 'Order successful',
            product: product.name,
            remainingStock: newStock
        });

    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({ error: 'Failed to process order' });
    }
});

/**
 * POST /reset
 * Resets all product stock to initial values (useful for testing)
 */
app.post('/reset', (req, res) => {
    try {
        const resetData = [
            { id: 1, stock: 50 },
            { id: 2, stock: 30 },
            { id: 3, stock: 100 },
            { id: 4, stock: 15 }
        ];

        const update = db.prepare('UPDATE products SET stock = ? WHERE id = ?');

        const resetStock = db.transaction((items) => {
            for (const item of items) {
                update.run(item.stock, item.id);
            }
        });

        resetStock(resetData);

        res.json({ message: 'Stock reset to initial values' });
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({ error: 'Failed to reset stock' });
    }
});

/**
 * Handle undefined routes
 */
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Gracefully close database on shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close();
    process.exit(0);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Product Ordering API running on http://localhost:${PORT}`);
    console.log('Database: SQLite (products.db)');
    console.log('Available endpoints:');
    console.log('  GET  /products  - List all products');
    console.log('  POST /order     - Place an order');
    console.log('  POST /reset     - Reset stock to initial values');
});
