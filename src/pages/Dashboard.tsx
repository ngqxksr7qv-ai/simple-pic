import React, { useState } from 'react';
import { useInventory } from '../store/InventoryContext';
import { Package, CheckCircle, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToCSV } from '../utils/exportUtils';

const Dashboard: React.FC = () => {
    const { products, counts, loading, deleteProducts, deleteAllProducts, bulkUpdateExpectedStock } = useInventory();

    // Calculate metrics
    const totalProducts = products.length;

    const totalExpectedStock = products.reduce((acc, p) => acc + (p.expectedStock || 0), 0);

    // Calculate total counted for each product
    const productCounts = products.map(p => {
        const counted = counts.filter(c => c.productId === p.id).reduce((acc, c) => acc + c.quantity, 0);
        return { ...p, counted };
    });

    const totalCountedItems = productCounts.reduce((acc, p) => acc + p.counted, 0);

    const completionPercentage = totalExpectedStock > 0
        ? Math.round((totalCountedItems / totalExpectedStock) * 100)
        : 0;

    const lowStockItems = productCounts.filter(p => p.counted < (p.expectedStock || 0));
    const overStockItems = productCounts.filter(p => p.counted > (p.expectedStock || 0));

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [filterType, setFilterType] = useState<'all' | 'discrepancies'>('discrepancies');
    const [storeFilter, setStoreFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showBulkEditConfirm, setShowBulkEditConfirm] = useState(false);
    const [bulkEditValue, setBulkEditValue] = useState('');

    const stats = [
        { name: 'Total Products', value: totalProducts, icon: Package, color: 'bg-blue-500' },
        { name: 'Total Counted', value: totalCountedItems, icon: CheckCircle, color: 'bg-green-500' },
        { name: 'Completion', value: `${completionPercentage}%`, icon: TrendingUp, color: 'bg-indigo-500' },
        { name: 'Discrepancies', value: lowStockItems.length + overStockItems.length, icon: AlertTriangle, color: 'bg-yellow-500' },
    ];

    // Pagination & Filter Logic
    const displayedItems = filterType === 'all'
        ? productCounts
        : [...lowStockItems, ...overStockItems];

    // Apply store and location filters
    const filteredItems = displayedItems.filter(p => {
        const matchesStore = !storeFilter || p.store === storeFilter;
        const matchesLocation = !locationFilter || p.location === locationFilter;
        return matchesStore && matchesLocation;
    });

    // Get unique store and location values for filters
    const storeOptions = Array.from(new Set(products.map(p => p.store).filter(Boolean))).sort();
    const locationOptions = Array.from(
        new Set(
            products
                .filter(p => !storeFilter || p.store === storeFilter)
                .map(p => p.location)
                .filter(Boolean)
        )
    ).sort();

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = () => {
        exportToCSV(products, counts);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(paginatedItems.map(p => p.id));
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
        if (window.confirm('Are you absolutely sure you want to delete ALL products? This cannot be undone.')) {
            await deleteAllProducts();
            setSelectedIds([]);
        }
    };

    return (
        <>
            {loading && (
                <div className="p-4 bg-yellow-100 text-yellow-800 text-center font-medium">
                    Loading data, please wait...
                </div>
            )}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <Download className="-ml-1 mr-2 h-5 w-5" />
                        Export Results
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className={`rounded-md p-3 ${item.color}`}>
                                                {Icon ? <Icon className="h-6 w-6 text-white" /> : <span>Icon</span>}
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                                <dd className="text-lg font-medium text-gray-900">{item.value}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Progress</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-right">{totalCountedItems} / {totalExpectedStock} items counted</p>
                </div>

                {/* Discrepancies Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {filterType === 'all' ? 'All Inventory Items' : 'Inventory Discrepancies'}
                        </h3>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <label htmlFor="filterType" className="mr-2 text-sm text-gray-700">Filter:</label>
                                <select
                                    id="filterType"
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value as 'all' | 'discrepancies');
                                        setCurrentPage(1);
                                    }}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="discrepancies">Discrepancies Only</option>
                                    <option value="all">All Items</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <label htmlFor="storeFilter" className="mr-2 text-sm text-gray-700">Store:</label>
                                <select
                                    id="storeFilter"
                                    value={storeFilter}
                                    onChange={(e) => {
                                        setStoreFilter(e.target.value);
                                        setLocationFilter('');
                                        setCurrentPage(1);
                                    }}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">All</option>
                                    {storeOptions.map(store => (
                                        <option key={store} value={store}>{store}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center">
                                <label htmlFor="locationFilter" className="mr-2 text-sm text-gray-700">Location:</label>
                                <select
                                    id="locationFilter"
                                    value={locationFilter}
                                    onChange={(e) => {
                                        setLocationFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">All</option>
                                    {locationOptions.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center">
                                <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-700">Show:</label>
                                <select
                                    id="itemsPerPage"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page on change
                                    }}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <Link to="/products" className="text-sm text-indigo-600 hover:text-indigo-900">View All Products</Link>
                        </div>
                    </div>

                    {/* Bulk Action Toolbar */}
                    {selectedIds.length > 0 && (
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center space-x-4">
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

                    {/* Top Pagination Controls */}
                    {displayedItems.length > 0 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, displayedItems.length)}</span> of <span className="font-medium">{displayedItems.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            </div>
                            {/* Mobile Pagination View */}
                            <div className="flex items-center justify-between w-full sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'text-gray-300 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'text-gray-300 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        {/* Mobile Card View */}
                        <div className="block sm:hidden">
                            {paginatedItems.map((product) => {
                                const diff = product.counted - (product.expectedStock || 0);
                                return (
                                    <div key={product.id} className="bg-white border-b border-gray-200 p-4 space-y-3">
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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${diff < 0 ? 'bg-red-100 text-red-800' : diff > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {diff < 0 ? `Missing ${Math.abs(diff)}` : diff > 0 ? `Surplus ${diff}` : 'Exact Match'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex space-x-4">
                                                <div>
                                                    <span className="text-gray-500">Expected:</span>
                                                    <span className="ml-1 font-medium text-gray-900">{product.expectedStock}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Counted:</span>
                                                    <span className="ml-1 font-medium text-gray-900">{product.counted}</span>
                                                </div>
                                            </div>
                                            <Link
                                                to="/count"
                                                state={{ sku: product.sku }}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md text-sm font-medium"
                                            >
                                                Count
                                            </Link>
                                        </div>

                                        {(product.store || product.location) && (
                                            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 space-y-1">
                                                {product.store && <div><span className="font-medium">Store:</span> {product.store}</div>}
                                                {product.location && <div><span className="font-medium">Location:</span> {product.location}</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredItems.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    {filterType === 'all' ? 'No items found.' : 'No discrepancies found. Good job!'}
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
                                            checked={paginatedItems.length > 0 && selectedIds.length === paginatedItems.length}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedItems.map((product) => {
                                    const diff = product.counted - (product.expectedStock || 0);
                                    return (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => handleSelectOne(product.id)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.store || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.location || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.expectedStock}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.counted}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${diff < 0 ? 'bg-red-100 text-red-800' : diff > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {diff < 0 ? `Missing ${Math.abs(diff)}` : diff > 0 ? `Surplus ${diff}` : 'Exact Match'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link
                                                    to="/count"
                                                    state={{ sku: product.sku }}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                                >
                                                    Continue Count
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                                            {filterType === 'all' ? 'No items found.' : 'No discrepancies found. Good job!'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Pagination Controls */}
                    {displayedItems.length > 0 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, displayedItems.length)}</span> of <span className="font-medium">{displayedItems.length}</span> results
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <label htmlFor="itemsPerPageBottom" className="mr-2 text-sm text-gray-700">Show:</label>
                                        <select
                                            id="itemsPerPageBottom"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1); // Reset to first page on change
                                            }}
                                            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                        >
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        <span className="text-sm text-gray-700">per page</span>
                                    </div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            </div>
                            {/* Mobile Pagination View */}
                            <div className="flex items-center justify-between w-full sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'text-gray-300 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'text-gray-300 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
        </>
    );
};

export default Dashboard;
