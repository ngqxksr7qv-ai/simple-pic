-- Step 12: Add Store and Location fields to Products Table
-- This migration adds store and location columns for better product categorization

ALTER TABLE products
ADD COLUMN store VARCHAR(100),
ADD COLUMN location VARCHAR(100);

-- Create indexes for performance on the new fields
CREATE INDEX idx_products_store ON products(organization_id, store);
CREATE INDEX idx_products_location ON products(organization_id, location);
CREATE INDEX idx_products_store_location ON products(organization_id, store, location);

-- Add helpful comment
COMMENT ON COLUMN products.store IS 'Store name or identifier where the product is located';
COMMENT ON COLUMN products.location IS 'Specific location within the store (e.g., aisle, shelf, section)';
