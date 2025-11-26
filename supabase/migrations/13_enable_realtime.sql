-- Enable Realtime for products and count_records tables
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table count_records;
