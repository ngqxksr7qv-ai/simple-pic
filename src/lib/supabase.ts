import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    organization_id: string | null;
                    role: 'owner' | 'admin' | 'member';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    organization_id?: string | null;
                    role?: 'owner' | 'admin' | 'member';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string | null;
                    organization_id?: string | null;
                    role?: 'owner' | 'admin' | 'member';
                    created_at?: string;
                    updated_at?: string;
                };
            };
            products: {
                Row: {
                    id: string;
                    organization_id: string;
                    sku: string;
                    name: string;
                    category_level_1: string | null;
                    category_level_2: string | null;
                    category_level_3: string | null;
                    price: number | null;
                    expected_stock: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    sku: string;
                    name: string;
                    category_level_1?: string | null;
                    category_level_2?: string | null;
                    category_level_3?: string | null;
                    price?: number | null;
                    expected_stock?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    sku?: string;
                    name?: string;
                    category_level_1?: string | null;
                    category_level_2?: string | null;
                    category_level_3?: string | null;
                    price?: number | null;
                    expected_stock?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            count_records: {
                Row: {
                    id: string;
                    organization_id: string;
                    product_id: string;
                    quantity: number;
                    timestamp: number;
                    counted_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    product_id: string;
                    quantity: number;
                    timestamp: number;
                    counted_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    product_id?: string;
                    quantity?: number;
                    timestamp?: number;
                    counted_by?: string | null;
                    created_at?: string;
                };
            };
        };
    };
}
