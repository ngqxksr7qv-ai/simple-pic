import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useInventory } from '../store/InventoryContext';
import type { Product } from '../types';
import { Plus, Minus, ScanLine, AlertCircle, Camera, X } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';

const CountInterface: React.FC = () => {
    const { getProductBySku, addCount, counts, products } = useInventory();
    const [skuInput, setSkuInput] = useState('');
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();

    // Focus input on mount and check for passed SKU
    useEffect(() => {
        inputRef.current?.focus();

        // Check if SKU was passed via navigation
        const passedSku = location.state?.sku;
        if (passedSku) {
            setSkuInput(passedSku);
            const product = getProductBySku(passedSku);
            if (product) {
                setCurrentProduct(product);
            } else {
                setError(`Product with SKU "${passedSku}" not found.`);
            }
            // Clear state to prevent re-triggering on refresh if desired, 
            // but for now keeping it simple.
            window.history.replaceState({}, document.title);
        }
    }, [location.state, getProductBySku]);

    const [isScanning, setIsScanning] = useState(false);

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        processSku(skuInput);
    };

    const processSku = (sku: string) => {
        setError('');
        const product = getProductBySku(sku);

        if (product) {
            setCurrentProduct(product);
            addCount(product.id, 1);
            setSkuInput(''); // Clear for next scan
        } else {
            setError(`Product with SKU "${sku}" not found.`);
            setCurrentProduct(null);
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        setIsScanning(false);
        setSkuInput(decodedText); // Optional: show what was scanned
        processSku(decodedText);
    };

    const [manualTotal, setManualTotal] = useState('');

    // Sync manual total input with actual total
    useEffect(() => {
        if (currentProduct) {
            const total = counts
                .filter(c => c.productId === currentProduct.id)
                .reduce((acc, c) => acc + c.quantity, 0);
            setManualTotal(total.toString());
        } else {
            setManualTotal('');
        }
    }, [currentProduct, counts]);

    const handleManualCount = (amount: number) => {
        if (currentProduct) {
            addCount(currentProduct.id, amount);
        }
    };

    const handleManualTotalSubmit = () => {
        if (!currentProduct) return;

        const newTotal = parseInt(manualTotal);
        if (isNaN(newTotal)) {
            // Reset to actual total if invalid
            const actualTotal = counts
                .filter(c => c.productId === currentProduct.id)
                .reduce((acc, c) => acc + c.quantity, 0);
            setManualTotal(actualTotal.toString());
            return;
        }

        const currentTotal = counts
            .filter(c => c.productId === currentProduct.id)
            .reduce((acc, c) => acc + c.quantity, 0);

        const diff = newTotal - currentTotal;
        if (diff !== 0) {
            addCount(currentProduct.id, diff);
        }
    };

    // Get recent counts for display
    const recentCounts = [...counts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <ScanLine className="mr-2" /> Inventory Count
                </h2>

                <form onSubmit={handleScan} className="mb-6">
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                        Scan Barcode / Enter SKU
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        💡 Click Camera icon to use your device's camera to scan
                    </p>
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            id="sku"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-lg border-gray-300 rounded-md p-3 border"
                            placeholder="Scan or type SKU..."
                            value={skuInput}
                            onChange={(e) => setSkuInput(e.target.value)}
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={() => setIsScanning(true)}
                            className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            title="Use Camera"
                        >
                            <Camera size={24} />
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                            Enter
                        </button>
                    </div>
                    {error && (
                        <div className="mt-2 text-red-600 text-sm flex items-center">
                            <AlertCircle size={16} className="mr-1" /> {error}
                        </div>
                    )}
                </form>

                {/* Scanner Modal */}
                {isScanning && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsScanning(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <div className="absolute top-0 right-0 pt-4 pr-4">
                                    <button
                                        type="button"
                                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={() => setIsScanning(false)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            Scan Barcode
                                        </h3>
                                        <div className="mt-4">
                                            <BarcodeScanner
                                                onScanSuccess={handleScanSuccess}
                                                onScanFailure={(err) => console.log(err)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentProduct && (
                    <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-medium text-gray-500">Last Scanned</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{currentProduct.name}</p>
                            <p className="text-gray-500">SKU: {currentProduct.sku}</p>
                            <p className="text-indigo-600 font-medium mt-1">Expected Stock: {currentProduct.expectedStock || 0}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => handleManualCount(-1)}
                                    className="p-4 rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                >
                                    <Minus size={32} />
                                </button>

                                <div className="text-center">
                                    <span className="block text-sm text-gray-500 mb-1">Total Counted</span>
                                    <input
                                        type="number"
                                        className="block w-32 text-center text-4xl font-bold text-indigo-600 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none bg-transparent mx-auto"
                                        value={manualTotal}
                                        onChange={(e) => setManualTotal(e.target.value)}
                                        onBlur={handleManualTotalSubmit}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => handleManualCount(1)}
                                    className="p-4 rounded-full bg-indigo-600 shadow-md text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                                >
                                    <Plus size={32} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {recentCounts.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {recentCounts.map((count) => {
                            const product = products.find(p => p.id === count.productId);
                            return (
                                <li key={count.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-gray-900">
                                            {product?.name || 'Unknown Product'}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <span className={`font-bold ${count.quantity > 0 ? 'text-green-600' : 'text-red-600'} mr-2`}>
                                                {count.quantity > 0 ? '+' : ''}{count.quantity}
                                            </span>
                                            <span>{new Date(count.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CountInterface;
