#!/usr/bin/env python3
"""
Seed Script: Generates a realistic enterprise E-Commerce / SaaS SQLite database.
Creates: company_sales.db
Tables: customers, products, orders, order_items, reviews
"""

import sqlite3
import random
from datetime import datetime, timedelta

def create_sample_db(db_path: str = "company_sales.db"):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Drop existing tables
    cur.executescript("""
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS customers;
    """)

    # Create tables
    cur.executescript("""
    CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        company TEXT,
        region TEXT NOT NULL CHECK(region IN ('North America', 'Europe', 'Asia Pacific', 'Latin America')),
        plan_tier TEXT NOT NULL CHECK(plan_tier IN ('Starter', 'Professional', 'Enterprise')),
        signup_date DATE NOT NULL,
        status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Churned', 'Pending'))
    );

    CREATE TABLE products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        stock_quantity INTEGER NOT NULL
    );

    CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_date DATE NOT NULL,
        order_status TEXT NOT NULL CHECK(order_status IN ('Completed', 'Shipped', 'Processing', 'Cancelled', 'Refunded')),
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        channel TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );

    CREATE TABLE order_items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        item_total REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    );

    CREATE TABLE reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        review_date DATE NOT NULL,
        comment TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    );
    """)

    # Seed Customers
    customers_data = [
        ("Sarah Jenkins", "sarah.j@acmecloud.com", "Acme Cloud", "North America", "Enterprise", "2023-01-15", "Active"),
        ("Marcus Vance", "m.vance@techpulse.io", "TechPulse IO", "Europe", "Enterprise", "2023-02-10", "Active"),
        ("Elena Rostova", "elena@nordicscale.de", "Nordic Scale", "Europe", "Professional", "2023-03-05", "Active"),
        ("Kenji Sato", "sato@kyototech.co.jp", "Kyoto Tech", "Asia Pacific", "Enterprise", "2023-04-12", "Active"),
        ("David Miller", "dmiller@apexlogistics.com", "Apex Logistics", "North America", "Professional", "2023-05-20", "Active"),
        ("Amina Diallo", "amina@saharasoft.com", "Sahara Soft", "Europe", "Starter", "2023-06-18", "Active"),
        ("Carlos Silva", "csilva@rioventures.br", "Rio Ventures", "Latin America", "Enterprise", "2023-07-22", "Active"),
        ("Priya Sharma", "priya@bangaloredata.in", "Bangalore Data", "Asia Pacific", "Professional", "2023-08-14", "Active"),
        ("Lucas Dubois", "ldubois@lyonanalytics.fr", "Lyon Analytics", "Europe", "Professional", "2023-09-01", "Active"),
        ("Chloe Bennett", "chloe@vanguardretail.com", "Vanguard Retail", "North America", "Enterprise", "2023-09-19", "Active"),
        ("Hiroshi Tanaka", "tanaka@osakabyte.jp", "Osaka Byte", "Asia Pacific", "Starter", "2023-10-03", "Churned"),
        ("Maria Gomez", "mgomez@solucionesmx.mx", "Soluciones MX", "Latin America", "Starter", "2023-11-15", "Active"),
        ("Liam O'Connor", "liam@dublindigital.ie", "Dublin Digital", "Europe", "Professional", "2023-12-05", "Active"),
        ("Rachel Green", "rachel@manhattangrid.com", "Manhattan Grid", "North America", "Enterprise", "2024-01-11", "Active"),
        ("Zhen Wei", "zwei@shanghaiforward.cn", "Shanghai Forward", "Asia Pacific", "Enterprise", "2024-02-08", "Active"),
        ("Mateo Rossi", "mrossi@milanodesign.it", "Milano Design", "Europe", "Starter", "2024-02-28", "Active"),
        ("Olivia Taylor", "olivia@sydneyfin.com.au", "Sydney Financial", "Asia Pacific", "Professional", "2024-03-14", "Active"),
        ("Noah Wright", "noah@austintechlabs.com", "Austin TechLabs", "North America", "Starter", "2024-04-02", "Churned"),
        ("Sofia Larsson", "sofia@stockholmnode.se", "Stockholm Node", "Europe", "Professional", "2024-04-25", "Active"),
        ("Gabriel Torres", "gtorres@bogotacloud.co", "Bogota Cloud", "Latin America", "Starter", "2024-05-10", "Active"),
    ]
    cur.executemany("""
    INSERT INTO customers (full_name, email, company, region, plan_tier, signup_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, customers_data)

    # Seed Products
    products_data = [
        ("SKU-AI-01", "AI Intelligence Pipeline", "Software", 499.00, 120.00, 9999),
        ("SKU-AI-02", "Vector Search Accelerator", "Software", 299.00, 60.00, 9999),
        ("SKU-SRV-01", "Enterprise Dedicated Node", "Infrastructure", 1250.00, 480.00, 45),
        ("SKU-SRV-02", "Multi-Region Failover Cluster", "Infrastructure", 2400.00, 950.00, 20),
        ("SKU-SEC-01", "Zero-Trust Identity Gateway", "Security", 350.00, 75.00, 9999),
        ("SKU-SEC-02", "Automated Compliance Auditor", "Security", 850.00, 180.00, 9999),
        ("SKU-SUP-01", "24/7 Dedicated Support SLA", "Services", 750.00, 300.00, 100),
        ("SKU-DAT-01", "Real-Time Streaming ETL Engine", "Data", 620.00, 140.00, 9999),
        ("SKU-DAT-02", "Data Warehouse Optimizer", "Data", 410.00, 90.00, 9999),
        ("SKU-DEV-01", "Developer Sandbox Seat Pack", "Software", 180.00, 30.00, 9999),
    ]
    cur.executemany("""
    INSERT INTO products (sku, product_name, category, price, cost, stock_quantity)
    VALUES (?, ?, ?, ?, ?, ?);
    """, products_data)

    # Seed Orders and Order Items
    random.seed(42)
    base_date = datetime(2024, 1, 1)
    channels = ["Direct Sales", "Partner Referral", "Web Self-Serve", "Inbound Marketing"]
    statuses = ["Completed", "Completed", "Completed", "Shipped", "Processing", "Cancelled"]
    pay_methods = ["Corporate Credit Card", "ACH Bank Transfer", "Wire Transfer", "Annual Invoice PO"]

    for order_id in range(1, 91):
        cust_id = random.randint(1, len(customers_data))
        days_offset = random.randint(0, 300)
        order_date = (base_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        status = random.choice(statuses)
        channel = random.choice(channels)
        pay_method = random.choice(pay_methods)

        # 1-4 items per order
        num_items = random.randint(1, 4)
        chosen_prods = random.sample(products_data, num_items)
        
        order_total = 0.0
        item_rows = []
        for prod in chosen_prods:
            sku, name, cat, price, cost, stock = prod
            # find product_id (1-indexed based on insertion)
            prod_id = [p[0] for p in products_data].index(sku) + 1
            qty = random.randint(1, 3) if cat != "Software" else random.randint(1, 10)
            item_subtotal = round(qty * price, 2)
            order_total += item_subtotal
            item_rows.append((order_id, prod_id, qty, price, item_subtotal))

        order_total = round(order_total, 2)
        cur.execute("""
        INSERT INTO orders (order_id, customer_id, order_date, order_status, total_amount, payment_method, channel)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (order_id, cust_id, order_date, status, order_total, pay_method, channel))

        cur.executemany("""
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, item_total)
        VALUES (?, ?, ?, ?, ?);
        """, item_rows)

    # Seed Customer Reviews
    sample_reviews = [
        (1, 1, 5, "2024-03-10", "AI pipeline halved our ETL latency. Outstanding stability."),
        (2, 3, 5, "2024-04-15", "Dedicated nodes handle our European peak loads without a blip."),
        (4, 5, 4, "2024-05-02", "Identity gateway integrates seamlessly with Okta and Google Workspace."),
        (7, 2, 5, "2024-06-11", "Vector search cut query latency down to 14 milliseconds."),
        (10, 4, 5, "2024-07-20", "Multi-region failover proved itself during a major cloud outage."),
        (14, 6, 4, "2024-08-05", "Automated compliance saved us 80+ engineering hours during SOC2 audit."),
        (5, 7, 5, "2024-09-01", "24/7 dedicated support resolved our critical ticket in under 20 mins."),
        (8, 8, 4, "2024-09-15", "Streaming ETL engine is rock solid with high volume telemetry."),
        (13, 9, 3, "2024-10-01", "Warehouse optimizer works well, documentation could use more examples."),
        (18, 1, 2, "2024-10-18", "Had trouble configuring custom connectors on older legacy servers."),
    ]
    cur.executemany("""
    INSERT INTO reviews (customer_id, product_id, rating, review_date, comment)
    VALUES (?, ?, ?, ?, ?);
    """, sample_reviews)

    conn.commit()
    conn.close()
    print(f"✅ Successfully created SQLite database at '{db_path}' with realistic enterprise data!")

if __name__ == "__main__":
    create_sample_db()
