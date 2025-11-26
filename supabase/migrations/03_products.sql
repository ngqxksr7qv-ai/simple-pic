-- Step 3: Create Products Table
-- Run this after creating organizations table

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_level_1 VARCHAR(100),
  category_level_2 VARCHAR(100),
  category_level_3 VARCHAR(100),
  price DECIMAL(10,2),
  expected_stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, sku)
);

-- Create indexes for performance
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_sku ON products(organization_id, sku);
CREATE INDEX idx_products_categories ON products(category_level_1, category_level_2, category_level_3);
