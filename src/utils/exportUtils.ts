import { saveAs } from 'file-saver';
import type { Product, CountRecord } from '../types';

export const exportToCSV = (products: Product[], counts: CountRecord[]) => {
    console.log('=== CSV EXPORT STARTED ===');
    console.log('Products:', products.length, 'Counts:', counts.length);

    // Headers
    const headers = ['SKU', 'Product Name', 'Category Level 1', 'Category Level 2', 'Category Level 3', 'Price', 'Expected Count', 'Actual Count', 'Discrepancy', 'Store', 'Location'];

    // Rows
    const rows = products.map(product => {
        const countedQuantity = counts
            .filter(c => c.productId === product.id)
            .reduce((acc, c) => acc + c.quantity, 0);

        return [
            product.sku,
            `"${product.name.replace(/"/g, '""')}"`, // Escape quotes
            product.categoryLevel1 || '',
            product.categoryLevel2 || '',
            product.categoryLevel3 || '',
            product.price || 0,
            product.expectedStock || 0,
            countedQuantity,
            countedQuantity - (product.expectedStock || 0),
            product.store || '',
            product.location || ''
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Generate filename: inventory_summary_[Date_Time].csv
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `inventory_summary_${dateStr}_${timeStr}.csv`;

    console.log('Filename:', fileName);
    console.log('CSV Content length:', csvContent.length, 'chars');
    console.log('Using FileSaver.js saveAs()');

    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        console.log('Blob created:', blob.size, 'bytes, type:', blob.type);

        saveAs(blob, fileName);

        console.log('=== saveAs() called successfully ===');
    } catch (error) {
        console.error('=== CSV Export FAILED ===');
        console.error('Error:', error);
        alert(`Export failed: ${error}\n\nPlease check the console for details.`);
    }
};

export const exportAuditLogToCSV = (products: Product[], counts: CountRecord[]) => {
    console.log('=== AUDIT LOG EXPORT STARTED ===');

    // Headers
    const headers = ['Timestamp', 'Date', 'Time', 'Counter Name', 'SKU', 'Product Name', 'Quantity', 'Store', 'Location'];

    // Sort counts by timestamp descending
    const sortedCounts = [...counts].sort((a, b) => b.timestamp - a.timestamp);

    // Rows
    const rows = sortedCounts.map(count => {
        const product = products.find(p => p.id === count.productId);
        const date = new Date(count.timestamp);

        return [
            count.timestamp,
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            `"${(count.counterName || 'Unknown').replace(/"/g, '""')}"`,
            product?.sku || 'Unknown',
            `"${(product?.name || 'Unknown').replace(/"/g, '""')}"`,
            count.quantity,
            product?.store || '',
            product?.location || ''
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Generate filename: audit_log_[Date_Time].csv
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `audit_log_${dateStr}_${timeStr}.csv`;

    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, fileName);
    } catch (error) {
        console.error('Error exporting audit log:', error);
        alert(`Export failed: ${error}`);
    }
};
