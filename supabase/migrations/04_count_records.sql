-- Step 4: Create Count Records Table
-- Run this after creating products table

CREATE TABLE count_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  counted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_counts_org ON count_records(organization_id);
CREATE INDEX idx_counts_product ON count_records(product_id);
CREATE INDEX idx_counts_timestamp ON count_records(timestamp);
CREATE INDEX idx_counts_user ON count_records(counted_by);
