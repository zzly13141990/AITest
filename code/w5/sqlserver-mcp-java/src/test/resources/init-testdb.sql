-- ============================================
-- SqlServer MCP — Test Database Initialization
-- ============================================

CREATE SCHEMA inventory;
GO

-- ============================================
-- Tables
-- ============================================
CREATE TABLE inventory.products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    category NVARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE inventory.orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    order_date DATETIME2 DEFAULT GETDATE(),
    customer_name NVARCHAR(100),
    CONSTRAINT FK_orders_products FOREIGN KEY (product_id) REFERENCES inventory.products(id)
);

CREATE TABLE dbo.audit_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    action NVARCHAR(50) NOT NULL,
    table_name NVARCHAR(100),
    record_id INT,
    changed_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================
-- Indexes
-- ============================================
CREATE NONCLUSTERED INDEX IX_products_category ON inventory.products(category);
CREATE NONCLUSTERED INDEX IX_orders_order_date ON inventory.orders(order_date);
CREATE NONCLUSTERED INDEX IX_orders_customer ON inventory.orders(customer_name);

-- ============================================
-- Sample Data
-- ============================================
INSERT INTO inventory.products (name, category, price, stock) VALUES
    ('Laptop', 'Electronics', 999.99, 10),
    ('Mouse', 'Electronics', 29.99, 100),
    ('Keyboard', 'Electronics', 79.99, 50),
    ('Desk', 'Furniture', 299.99, 15),
    ('Chair', 'Furniture', 199.99, 20);

INSERT INTO inventory.orders (product_id, quantity, total_price, customer_name) VALUES
    (1, 2, 1999.98, 'Alice'),
    (2, 5, 149.95, 'Bob'),
    (3, 1, 79.99, 'Alice'),
    (4, 1, 299.99, 'Charlie'),
    (5, 4, 799.96, 'Bob');

-- ============================================
-- Views
-- ============================================
CREATE VIEW inventory.product_summary AS
SELECT
    p.id,
    p.name,
    p.category,
    p.price,
    p.stock,
    COUNT(o.id) AS order_count
FROM inventory.products p
LEFT JOIN inventory.orders o ON p.id = o.product_id
GROUP BY p.id, p.name, p.category, p.price, p.stock;
GO
