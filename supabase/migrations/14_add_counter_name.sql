-- Add counter_name column to count_records table
ALTER TABLE count_records ADD COLUMN counter_name TEXT;

-- Create index for reporting performance
CREATE INDEX idx_counts_counter_name ON count_records(counter_name);
