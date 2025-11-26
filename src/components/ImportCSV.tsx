import React, { useState } from 'react';
import { Upload, X, Download, Check } from 'lucide-react';
import { parseCSV, readCSVFile } from '../utils/csvParser';
import type { Product } from '../types';

interface ImportCSVProps {
    onImport: (products: Omit<Product, 'id'>[]) => void;
    onClose: () => void;
}

const PRODUCT_FIELDS = [
    { key: 'sku', label: 'SKU *', required: true },
    { key: 'name', label: 'Product Name *', required: true },
    { key: 'categoryLevel1', label: 'Category Level 1', required: false },
    { key: 'categoryLevel2', label: 'Category Level 2', required: false },
    { key: 'categoryLevel3', label: 'Category Level 3', required: false },
    { key: 'price', label: 'Price', required: false },
    { key: 'expectedStock', label: 'Expected Stock', required: false },
] as const;

const ImportCSV: React.FC<ImportCSVProps> = ({ onImport, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [skipColumns, setSkipColumns] = useState<Set<string>>(new Set());
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        try {
            setFile(selectedFile);
            const content = await readCSVFile(selectedFile);
            const { headers, rows } = parseCSV(content);

            setCsvHeaders(headers);
            setCsvRows(rows);

            // Auto-map exact matches (case-insensitive)
            const autoMapping: Record<string, string> = {};
            PRODUCT_FIELDS.forEach(field => {
                const match = headers.find(h =>
                    h.toLowerCase() === field.label.toLowerCase().replace(' *', '') ||
                    h.toLowerCase() === field.key.toLowerCase()
                );
                if (match) {
                    autoMapping[field.key] = match;
                }
            });
            setColumnMapping(autoMapping);
            setStep('mapping');
        } catch (error) {
            alert('Failed to read CSV file. Please ensure it is a valid CSV.');
            console.error(error);
        }
    };

    const toggleSkipColumn = (header: string) => {
        const newSkip = new Set(skipColumns);
        if (newSkip.has(header)) {
            newSkip.delete(header);
        } else {
            newSkip.add(header);
        }
        setSkipColumns(newSkip);
    };

    const handleColumnMappingChange = (productField: string, csvHeader: string) => {
        setColumnMapping(prev => ({
            ...prev,
            [productField]: csvHeader,
        }));
    };

    const getPreviewData = (): Omit<Product, 'id'>[] => {
        return csvRows.slice(0, 5).map(row => {
            const product: any = {};

            Object.entries(columnMapping).forEach(([productField, csvHeader]) => {
                if (skipColumns.has(csvHeader)) return;

                const columnIndex = csvHeaders.indexOf(csvHeader);
                if (columnIndex >= 0) {
                    const value = row[columnIndex];

                    // Type conversions
                    if (productField === 'price') {
                        product[productField] = parseFloat(value) || 0;
                    } else if (productField === 'expectedStock') {
                        product[productField] = parseInt(value) || 0;
                    } else {
                        product[productField] = value;
                    }
                }
            });

            return product as Omit<Product, 'id'>;
        });
    };

    const handleImport = () => {
        const products: Omit<Product, 'id'>[] = csvRows.map(row => {
            const product: any = {};

            Object.entries(columnMapping).forEach(([productField, csvHeader]) => {
                if (skipColumns.has(csvHeader)) return;

                const columnIndex = csvHeaders.indexOf(csvHeader);
                if (columnIndex >= 0) {
                    const value = row[columnIndex];

                    if (productField === 'price') {
                        product[productField] = parseFloat(value) || 0;
                    } else if (productField === 'expectedStock') {
                        product[productField] = parseInt(value) || 0;
                    } else {
                        product[productField] = value;
                    }
                }
            });

            return product as Omit<Product, 'id'>;
        });

        // Filter out products without required fields
        const validProducts = products.filter(p => p.sku && p.name);

        if (validProducts.length === 0) {
            alert('No valid products to import. Make sure SKU and Name are mapped.');
            return;
        }

        onImport(validProducts);
    };

    const canProceed = () => {
        const requiredFieldsMapped = PRODUCT_FIELDS
            .filter(f => f.required)
            .every(f => columnMapping[f.key]);
        return requiredFieldsMapped;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Import Products from CSV</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {step === 'upload' && 'Upload a CSV file to import products'}
                            {step === 'mapping' && 'Map CSV columns to product fields'}
                            {step === 'preview' && 'Preview and confirm import'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                    <label htmlFor="csv-upload" className="cursor-pointer">
                                        <span className="mt-2 block text-sm font-medium text-gray-900">
                                            Click to upload or drag and drop
                                        </span>
                                        <span className="mt-1 block text-xs text-gray-500">CSV file only</span>
                                    </label>
                                    <input
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                            {file && (
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-green-900">{file.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'mapping' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    Map the columns from your CSV file to the product fields. You can skip columns you don't want to import.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {PRODUCT_FIELDS.map(field => (
                                    <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-medium text-gray-700">
                                            {field.label}
                                        </label>
                                        <select
                                            value={columnMapping[field.key] || ''}
                                            onChange={(e) => handleColumnMappingChange(field.key, e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                        >
                                            <option value="">-- Not Mapped --</option>
                                            {csvHeaders.map(header => (
                                                <option key={header} value={header} disabled={skipColumns.has(header)}>
                                                    {header} {skipColumns.has(header) ? '(Skipped)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex items-center space-x-4">
                                            {columnMapping[field.key] && (
                                                <label className="flex items-center text-sm text-gray-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={skipColumns.has(columnMapping[field.key])}
                                                        onChange={() => toggleSkipColumn(columnMapping[field.key])}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                                                    />
                                                    Skip this column
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!canProceed() && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ Please map required fields (SKU and Product Name) to proceed.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-800">
                                    Preview of first 5 records. {csvRows.length} total products will be imported.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cat Lv 1</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cat Lv 2</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cat Lv 3</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getPreviewData().map((product, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 text-sm text-gray-900">{product.sku}</td>
                                                <td className="px-3 py-2 text-sm text-gray-900">{product.name}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500">{product.categoryLevel1 || '-'}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500">{product.categoryLevel2 || '-'}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500">{product.categoryLevel3 || '-'}</td>
                                                <td className="px-3 py-2 text-sm text-gray-900">${product.price?.toFixed(2) || '0.00'}</td>
                                                <td className="px-3 py-2 text-sm text-gray-900">{product.expectedStock || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    <div className="flex space-x-3">
                        {step === 'mapping' && (
                            <>
                                <button
                                    onClick={() => setStep('upload')}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep('preview')}
                                    disabled={!canProceed()}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next: Preview
                                </button>
                            </>
                        )}

                        {step === 'preview' && (
                            <>
                                <button
                                    onClick={() => setStep('mapping')}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleImport}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                >
                                    <Download className="inline h-4 w-4 mr-2" />
                                    Import {csvRows.length} Products
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportCSV;
