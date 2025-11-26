export interface Product {
    id: string;
    sku: string;
    name: string;
    categoryLevel1?: string;
    categoryLevel2?: string;
    categoryLevel3?: string;
    price?: number;
    expectedStock?: number;
    store?: string;
    location?: string;
}

export interface CountRecord {
    id: string;
    productId: string;
    quantity: number;
    timestamp: number;
    counterName?: string;
}

export interface InventoryState {
    products: Product[];
    counts: CountRecord[];
}
