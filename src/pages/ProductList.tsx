import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../store/InventoryContext';
import { Plus, Search, Trash2, Edit2, Check, X, Upload, ScanLine } from 'lucide-react';
import ImportCSV from '../components/ImportCSV';
import type { Product } from '../types';

const ProductList: React.FC = () => {
    const { products, addProduct, addProducts, updateProduct, deleteProduct, deleteProducts, deleteAllProducts, bulkUpdateExpectedStock, loading } = useInventory();

    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Product>>({});
    const [showImport, setShowImport] = useState(false);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showBulkEditConfirm, setShowBulkEditConfirm] = useState(false);
    const [bulkEditValue, setBulkEditValue] = useState('');

    // Category filters
    const [categoryLevel1Filter, setCategoryLevel1Filter] = useState('');
    const [categoryLevel2Filter, setCategoryLevel2Filter] = useState('');
    const [categoryLevel3Filter, setCategoryLevel3Filter] = useState('');
    const [storeFilter, setStoreFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        categoryLevel1: '',
        categoryLevel2: '',
        categoryLevel3: '',
        price: 0,
        expectedStock: 0,
        store: '',
        location: '',
    });

    // Get unique category values for filters
    const categoryLevel1Options = useMemo(() => {
        const values = products
            .map(p => p.categoryLevel1)
            .filter((v): v is string => Boolean(v));
        return Array.from(new Set(values)).sort();
    }, [products]);

    const categoryLevel2Options = useMemo(() => {
        const values = products
            .filter(p => !categoryLevel1Filter || p.categoryLevel1 === categoryLevel1Filter)
            .map(p => p.categoryLevel2)
            .filter((v): v is string => Boolean(v));
        return Array.from(new Set(values)).sort();
    }, [products, categoryLevel1Filter]);

    const categoryLevel3Options = useMemo(() => {
        const values = products
            .filter(p => !categoryLevel1Filter || p.categoryLevel1 === categoryLevel1Filter)
            .filter(p => !categoryLevel2Filter || p.categoryLevel2 === categoryLevel2Filter)
            .map(p => p.categoryLevel3)
            .filter((v): v is string => Boolean(v));
        return Array.from(new Set(values)).sort();
    }, [products, categoryLevel1Filter, categoryLevel2Filter]);

    const storeOptions = useMemo(() => {
        const values = products
            .map(p => p.store)
            .filter((v): v is string => Boolean(v));
        return Array.from(new Set(values)).sort();
    }, [products]);

    const locationOptions = useMemo(() => {
        const values = products
            .filter(p => !storeFilter || p.store === storeFilter)
            .map(p => p.location)
            .filter((v): v is string => Boolean(v));
        return Array.from(new Set(values)).sort();
    }, [products, storeFilter]);

    // Add product
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sku || !formData.name) return;
        addProduct(formData);
        setFormData({ sku: '', name: '', categoryLevel1: '', categoryLevel2: '', categoryLevel3: '', price: 0, expectedStock: 0, store: '', location: '' });
    };

    // Start editing
    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setEditFormData({ ...product });
    };

    // Save edit
    const handleSaveEdit = () => {
        if (editingId) {
            updateProduct(editingId, editFormData);
            setEditingId(null);
            setEditFormData({});
        }
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    // Update expected quantity inline
    const handleExpectedStockChange = (productId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        updateProduct(productId, { expectedStock: numValue });
    };

    // Handle CSV import
    const handleImport = (importedProducts: Omit<Product, 'id'>[]) => {
        addProducts(importedProducts);
        setShowImport(false);
        setCurrentPage(1);
        alert(`Successfully imported ${importedProducts.length} products!`);
    };

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.categoryLevel1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.categoryLevel2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.categoryLevel3?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.store?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.location?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory1 = !categoryLevel1Filter || p.categoryLevel1 === categoryLevel1Filter;
        const matchesCategory2 = !categoryLevel2Filter || p.categoryLevel2 === categoryLevel2Filter;
        const matchesCategory3 = !categoryLevel3Filter || p.categoryLevel3 === categoryLevel3Filter;
        const matchesStore = !storeFilter || p.store === storeFilter;
        const matchesLocation = !locationFilter || p.location === locationFilter;

        return matchesSearch && matchesCategory1 && matchesCategory2 && matchesCategory3 && matchesStore && matchesLocation;
    });

    // Pagination calculation
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Page change handlers
    const handlePageChange = (newPage: number) => {
        setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(paginatedProducts.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        await deleteProducts(selectedIds);
        setSelectedIds([]);
        setShowBulkDeleteConfirm(false);
    };

    const handleBulkEdit = async () => {
        const val = parseInt(bulkEditValue, 10);
        if (!isNaN(val)) {
            await bulkUpdateExpectedStock(selectedIds, val);
            setSelectedIds([]);
            setBulkEditValue('');
            setShowBulkEditConfirm(false);
        }
    };

    const handleDeleteAll = async () => {
        const confirmText = "DELETE";
        const input = window.prompt(`To confirm deleting ALL products, please type "${confirmText}" below:`);
        if (input === confirmText) {
            await deleteAllProducts();
            setSelectedIds([]);
        }
    };

    return (
        <div className="space-y-6">
            {loading && (
                <div className="p-4 bg-yellow-100 text-yellow-800 text-center font-medium">
                    Loading data, please wait...
                </div>
            )}
            {/* Header with Import Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Upload className="h-5 w-5 mr-2" />
                    Import CSV
                </button>
            </div>

            {/* Import Modal */}
            {showImport && (
                <ImportCSV
                    onImport={handleImport}
                    onClose={() => setShowImport(false)}
                />
            )}

            {/* Add Product Form */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <input
                            type="text"
                            placeholder="SKU *"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Product Name *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            value={formData.price || ''}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                        <input
                            type="number"
                            placeholder="Expected Stock"
                            value={formData.expectedStock || ''}
                            onChange={(e) => setFormData({ ...formData, expectedStock: parseInt(e.target.value) || 0 })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <input
                            type="text"
                            placeholder="Category Level 1"
                            value={formData.categoryLevel1}
                            onChange={(e) => setFormData({ ...formData, categoryLevel1: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                        <input
                            type="text"
                            placeholder="Category Level 2"
                            value={formData.categoryLevel2}
                            onChange={(e) => setFormData({ ...formData, categoryLevel2: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                        <input
                            type="text"
                            placeholder="Category Level 3"
                            value={formData.categoryLevel3}
                            onChange={(e) => setFormData({ ...formData, categoryLevel3: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                            type="text"
                            placeholder="Store"
                            value={formData.store}
                            onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Product
                    </button>
                </form>
            </div>

            {/* Search and Filters */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="space-y-4">
                    {/* Search and Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-700">Show:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-gray-700">per page</span>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category Level 1</label>
                            <select
                                value={categoryLevel1Filter}
                                onChange={(e) => {
                                    setCategoryLevel1Filter(e.target.value);
                                    setCategoryLevel2Filter('');
                                    setCategoryLevel3Filter('');
                                    setCurrentPage(1);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="">All</option>
                                {categoryLevel1Options.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category Level 2</label>
                            <select
                                value={categoryLevel2Filter}
                                onChange={(e) => {
                                    setCategoryLevel2Filter(e.target.value);
                                    setCategoryLevel3Filter('');
                                    setCurrentPage(1);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="">All</option>
                                {categoryLevel2Options.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category Level 3</label>
                            <select
                                value={categoryLevel3Filter}
                                onChange={(e) => {
                                    setCategoryLevel3Filter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="">All</option>
                                {categoryLevel3Options.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Store and Location Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                            <select
                                value={storeFilter}
                                onChange={(e) => {
                                    setStoreFilter(e.target.value);
                                    setLocationFilter('');
                                    setCurrentPage(1);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="">All</option>
                                {storeOptions.map(store => (
                                    <option key={store} value={store}>{store}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <select
                                value={locationFilter}
                                onChange={(e) => {
                                    setLocationFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="">All</option>
                                {locationOptions.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 border border-gray-200 rounded-md flex items-center space-x-4">
                    <span className="text-sm text-gray-700 font-medium">{selectedIds.length} selected</span>
                    <button
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                        Delete Selected
                    </button>
                    <button
                        onClick={() => setShowBulkEditConfirm(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                        Edit Expected Stock
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 ml-auto"
                    >
                        Delete All Products
                    </button>
                </div>
            )}

            {/* Product Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Top Pagination Controls */}
                {filteredProducts.length > 0 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
                                    <span className="font-medium">{filteredProducts.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    {/* Mobile Card View */}
                    <div className="block sm:hidden">
                        {paginatedProducts.map((product) => (
                            <div key={product.id} className="bg-white border-b border-gray-200 p-4 space-y-3">
                                {editingId === product.id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => handleSelectOne(product.id)}
                                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={editFormData.name || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border mb-2"
                                                    placeholder="Name"
                                                />
                                                <div className="text-xs text-gray-500">{product.sku}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                value={editFormData.price || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                                                className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                placeholder="Price"
                                            />
                                            <input
                                                type="number"
                                                value={editFormData.expectedStock || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, expectedStock: parseInt(e.target.value) || 0 })}
                                                className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                placeholder="Stock"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={handleSaveEdit} className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700">
                                                Save
                                            </button>
                                            <button onClick={handleCancelEdit} className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => handleSelectOne(product.id)}
                                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                                                />
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                                                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">${product.price?.toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">Stock: {product.expectedStock}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <div className="text-xs text-gray-500 space-y-1">
                                                {product.categoryLevel1 && <div><span className="font-medium">Cat:</span> {product.categoryLevel1}</div>}
                                                {product.store && <div><span className="font-medium">Store:</span> {product.store}</div>}
                                                {product.location && <div><span className="font-medium">Loc:</span> {product.location}</div>}
                                            </div>
                                            <div className="flex space-x-3">
                                                <Link
                                                    to="/count"
                                                    state={{ sku: product.sku }}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <ScanLine className="h-5 w-5" />
                                                </Link>
                                                <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => setDeleteConfirmationId(product.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {paginatedProducts.length === 0 && (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No products found. Add your first product above!
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cat Lv 1</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cat Lv 2</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cat Lv 3</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProducts.map((product) => (
                                <tr key={product.id}>
                                    {editingId === product.id ? (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => handleSelectOne(product.id)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={editFormData.name || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={editFormData.categoryLevel1 || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, categoryLevel1: e.target.value })}
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={editFormData.categoryLevel2 || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, categoryLevel2: e.target.value })}
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={editFormData.categoryLevel3 || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, categoryLevel3: e.target.value })}
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={editFormData.store || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, store: e.target.value })}
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={editFormData.location || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={editFormData.price || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                                                    className="block w-24 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={editFormData.expectedStock || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, expectedStock: parseInt(e.target.value) || 0 })}
                                                    className="block w-24 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={handleSaveEdit} className="inline-flex items-center text-green-600 hover:text-green-900">
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button onClick={handleCancelEdit} className="inline-flex items-center text-red-600 hover:text-red-900">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => handleSelectOne(product.id)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoryLevel1 || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoryLevel2 || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoryLevel3 || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.store || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.location || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price?.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={product.expectedStock || ''}
                                                    onChange={(e) => handleExpectedStockChange(product.id, e.target.value)}
                                                    className="block w-20 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1 border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <Link
                                                    to="/count"
                                                    state={{ sku: product.sku }}
                                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                                                    title="Start/Continue Count"
                                                >
                                                    <ScanLine className="h-5 w-5" />
                                                </Link>
                                                <button onClick={() => handleEdit(product)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => setDeleteConfirmationId(product.id)} className="inline-flex items-center text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {paginatedProducts.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No products found. Add your first product above!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {filteredProducts.length > 0 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
                                    <span className="font-medium">{filteredProducts.length}</span> results
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-700">Show:</label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                        className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                    >
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span className="text-sm text-gray-700">per page</span>
                                </div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmationId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Delete</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to delete this product? This action cannot be undone.
                            {products.find(p => p.id === deleteConfirmationId)?.name && (
                                <span className="block mt-2 font-medium text-gray-900">
                                    "{products.find(p => p.id === deleteConfirmationId)?.name}"
                                </span>
                            )}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirmationId(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirmationId) {
                                        deleteProduct(deleteConfirmationId);
                                        setDeleteConfirmationId(null);
                                    }
                                }}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Bulk Delete</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to delete the selected {selectedIds.length} products? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Edit Expected Stock Modal */}
            {showBulkEditConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Expected Stock</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Enter new expected stock value for the selected {selectedIds.length} products.
                        </p>
                        <input
                            type="number"
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="New Expected Stock"
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowBulkEditConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkEdit}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
