import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Product, InventoryState } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface InventoryContextType extends InventoryState {
    loading: boolean;
    counterName: string;
    setCounterName: (name: string) => void;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    addProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    deleteProducts: (ids: string[]) => Promise<void>;
    deleteAllProducts: () => Promise<void>;
    bulkUpdateExpectedStock: (ids: string[], expectedStock: number) => Promise<void>;
    addCount: (productId: string, quantity: number) => Promise<void>;
    resetCounts: () => Promise<void>;
    getProductBySku: (sku: string) => Product | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_STATE: InventoryState = {
    products: [],
    counts: [],
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { organization, user } = useAuth();
    const [state, setState] = useState<InventoryState>(INITIAL_STATE);
    const [loading, setLoading] = useState(true);
    const [counterName, setCounterNameState] = useState(() => {
        return localStorage.getItem('inventory_counter_name') || '';
    });

    const setCounterName = (name: string) => {
        setCounterNameState(name);
        localStorage.setItem('inventory_counter_name', name);
    };

    // Load data when organization is available
    useEffect(() => {
        let channel: RealtimeChannel;

        if (organization?.id) {
            loadData();

            // Subscribe to real-time changes
            channel = supabase
                .channel('inventory-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'products',
                        filter: `organization_id=eq.${organization.id}`,
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            const newProduct: Product = {
                                id: payload.new.id,
                                sku: payload.new.sku,
                                name: payload.new.name,
                                categoryLevel1: payload.new.category_level_1,
                                categoryLevel2: payload.new.category_level_2,
                                categoryLevel3: payload.new.category_level_3,
                                price: payload.new.price,
                                expectedStock: payload.new.expected_stock,
                                store: payload.new.store,
                                location: payload.new.location,
                            };
                            setState((prev) => ({
                                ...prev,
                                products: [...prev.products, newProduct],
                            }));
                        } else if (payload.eventType === 'UPDATE') {
                            const updatedProduct: Product = {
                                id: payload.new.id,
                                sku: payload.new.sku,
                                name: payload.new.name,
                                categoryLevel1: payload.new.category_level_1,
                                categoryLevel2: payload.new.category_level_2,
                                categoryLevel3: payload.new.category_level_3,
                                price: payload.new.price,
                                expectedStock: payload.new.expected_stock,
                                store: payload.new.store,
                                location: payload.new.location,
                            };
                            setState((prev) => ({
                                ...prev,
                                products: prev.products.map((p) =>
                                    p.id === payload.new.id ? updatedProduct : p
                                ),
                            }));
                        } else if (payload.eventType === 'DELETE') {
                            setState((prev) => ({
                                ...prev,
                                products: prev.products.filter((p) => p.id !== payload.old.id),
                            }));
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'count_records',
                        filter: `organization_id=eq.${organization.id}`,
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            const newCount = {
                                id: payload.new.id,
                                productId: payload.new.product_id,
                                quantity: payload.new.quantity,
                                timestamp: new Date(payload.new.timestamp).getTime(),
                                counterName: payload.new.counter_name,
                            };
                            setState((prev) => {
                                if (prev.counts.some(c => c.id === newCount.id)) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    counts: [...prev.counts, newCount],
                                };
                            });
                        } else if (payload.eventType === 'DELETE') {
                            if (payload.old.id) {
                                setState((prev) => ({
                                    ...prev,
                                    counts: prev.counts.filter((c) => c.id !== payload.old.id),
                                }));
                            }
                        }
                    }
                )
                .subscribe();
        } else {
            setState(INITIAL_STATE);
            setLoading(false);
        }

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [organization?.id]);

    const loadData = async () => {
        if (!organization?.id) return;

        try {
            setLoading(true);

            // Helper to fetch all data in chunks
            const fetchAll = async (table: string, orderBy: string) => {
                let allData: any[] = [];
                let from = 0;
                const size = 1000;
                let hasMore = true;

                while (hasMore) {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .eq('organization_id', organization.id)
                        .order(orderBy, { ascending: false })
                        .range(from, from + size - 1);

                    if (error) throw error;

                    if (data) {
                        allData = [...allData, ...data];
                        if (data.length < size) hasMore = false;
                        from += size;
                    } else {
                        hasMore = false;
                    }
                }
                return allData;
            };

            // Load products
            const productsData = await fetchAll('products', 'created_at');

            // Map DB snake_case to frontend camelCase
            const mappedProducts: Product[] = (productsData || []).map(p => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                categoryLevel1: p.category_level_1,
                categoryLevel2: p.category_level_2,
                categoryLevel3: p.category_level_3,
                price: p.price,
                expectedStock: p.expected_stock,
                store: p.store,
                location: p.location,
            }));

            // Load count records
            const countsData = await fetchAll('count_records', 'timestamp');

            const mappedCounts = (countsData || []).map(c => ({
                id: c.id,
                productId: c.product_id,
                quantity: c.quantity,
                timestamp: new Date(c.timestamp).getTime(),
                counterName: c.counter_name,
            }));

            setState({
                products: mappedProducts,
                counts: mappedCounts,
            });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (productData: Omit<Product, 'id'>) => {
        if (!organization?.id) {
            throw new Error('No organization selected');
        }

        try {
            // Map frontend camelCase to DB snake_case
            const dbProduct = {
                organization_id: organization.id,
                sku: productData.sku,
                name: productData.name,
                category_level_1: productData.categoryLevel1,
                category_level_2: productData.categoryLevel2,
                category_level_3: productData.categoryLevel3,
                price: productData.price,
                expected_stock: productData.expectedStock,
                store: productData.store,
                location: productData.location,
            };

            const { data, error } = await supabase
                .from('products')
                .insert(dbProduct)
                .select()
                .single();

            if (error) throw error;

            // Map back to frontend model
            const newProduct: Product = {
                id: data.id,
                sku: data.sku,
                name: data.name,
                categoryLevel1: data.category_level_1,
                categoryLevel2: data.category_level_2,
                categoryLevel3: data.category_level_3,
                price: data.price,
                expectedStock: data.expected_stock,
                store: data.store,
                location: data.location,
            };

            setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    };

    const addProducts = async (productsData: Omit<Product, 'id'>[]) => {
        if (!organization?.id) {
            throw new Error('No organization selected');
        }

        try {
            const productsWithOrg = productsData.map(p => ({
                organization_id: organization.id,
                sku: p.sku,
                name: p.name,
                category_level_1: p.categoryLevel1,
                category_level_2: p.categoryLevel2,
                category_level_3: p.categoryLevel3,
                price: p.price,
                expected_stock: p.expectedStock,
                store: p.store,
                location: p.location,
            }));

            const { data, error } = await supabase
                .from('products')
                .insert(productsWithOrg)
                .select();

            if (error) throw error;

            const newProducts: Product[] = (data || []).map(p => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                categoryLevel1: p.category_level_1,
                categoryLevel2: p.category_level_2,
                categoryLevel3: p.category_level_3,
                price: p.price,
                expectedStock: p.expected_stock,
                store: p.store,
                location: p.location,
            }));

            setState(prev => ({ ...prev, products: [...newProducts, ...prev.products] }));
        } catch (error) {
            console.error('Error adding products:', error);
            throw error;
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        try {
            // Map updates to snake_case
            const dbUpdates: any = {};
            if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.categoryLevel1 !== undefined) dbUpdates.category_level_1 = updates.categoryLevel1;
            if (updates.categoryLevel2 !== undefined) dbUpdates.category_level_2 = updates.categoryLevel2;
            if (updates.categoryLevel3 !== undefined) dbUpdates.category_level_3 = updates.categoryLevel3;
            if (updates.price !== undefined) dbUpdates.price = updates.price;
            if (updates.expectedStock !== undefined) dbUpdates.expected_stock = updates.expectedStock;
            if (updates.store !== undefined) dbUpdates.store = updates.store;
            if (updates.location !== undefined) dbUpdates.location = updates.location;

            const { data, error } = await supabase
                .from('products')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updatedProduct: Product = {
                id: data.id,
                sku: data.sku,
                name: data.name,
                categoryLevel1: data.category_level_1,
                categoryLevel2: data.category_level_2,
                categoryLevel3: data.category_level_3,
                price: data.price,
                expectedStock: data.expected_stock,
                store: data.store,
                location: data.location,
            };

            setState(prev => ({
                ...prev,
                products: prev.products.map(p => (p.id === id ? updatedProduct : p)),
            }));
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setState(prev => ({
                ...prev,
                products: prev.products.filter(p => p.id !== id),
            }));
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    };

    const deleteProducts = async (ids: string[]) => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .in('id', ids);

            if (error) throw error;

            setState(prev => ({
                ...prev,
                products: prev.products.filter(p => !ids.includes(p.id)),
            }));
        } catch (error) {
            console.error('Error deleting products:', error);
            throw error;
        }
    };

    const deleteAllProducts = async () => {
        if (!organization?.id) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('organization_id', organization.id);

            if (error) throw error;

            setState(prev => ({
                ...prev,
                products: [],
            }));
        } catch (error) {
            console.error('Error deleting all products:', error);
            throw error;
        }
    };

    const bulkUpdateExpectedStock = async (ids: string[], expectedStock: number) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ expected_stock: expectedStock })
                .in('id', ids);

            if (error) throw error;

            setState(prev => ({
                ...prev,
                products: prev.products.map(p =>
                    ids.includes(p.id) ? { ...p, expectedStock } : p
                ),
            }));
        } catch (error) {
            console.error('Error bulk updating expected stock:', error);
            throw error;
        }
    };

    const addCount = async (productId: string, quantity: number) => {
        if (!organization?.id) {
            throw new Error('No organization selected');
        }

        try {
            const { data, error } = await supabase
                .from('count_records')
                .insert({
                    organization_id: organization.id,
                    product_id: productId,
                    quantity,
                    timestamp: Date.now(),
                    counted_by: user?.id,
                    counter_name: counterName || 'Unknown',
                })
                .select()
                .single();

            if (error) throw error;

            const newCount = {
                id: data.id,
                productId: data.product_id,
                quantity: data.quantity,
                timestamp: new Date(data.timestamp).getTime(),
                counterName: data.counter_name,
            };

            setState(prev => {
                if (prev.counts.some(c => c.id === newCount.id)) {
                    return prev;
                }
                return { ...prev, counts: [...prev.counts, newCount] };
            });
        } catch (error) {
            console.error('Error adding count:', error);
            throw error;
        }
    };

    const resetCounts = async () => {
        if (!organization?.id) {
            throw new Error('No organization selected');
        }

        try {
            const { error } = await supabase
                .from('count_records')
                .delete()
                .eq('organization_id', organization.id);

            if (error) throw error;

            setState(prev => ({ ...prev, counts: [] }));
        } catch (error) {
            console.error('Error resetting counts:', error);
            throw error;
        }
    };

    const getProductBySku = (sku: string) => {
        return state.products.find(p => p.sku === sku);
    };

    return (
        <InventoryContext.Provider
            value={{
                ...state,
                loading,
                counterName,
                setCounterName,
                addProduct,
                addProducts,
                updateProduct,
                deleteProduct,
                deleteProducts,
                deleteAllProducts,
                bulkUpdateExpectedStock,
                addCount,
                resetCounts,
                getProductBySku,
            }}
        >
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
