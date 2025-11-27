import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const regionId = 'html5qr-code-full-region';
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [permissionRequested, setPermissionRequested] = useState<boolean>(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch(err => console.warn('Failed to stop scanner during cleanup', err));
                    }
                    // Attempt to clear, but don't crash if it fails (e.g. element removed)
                    try {
                        scannerRef.current.clear();
                    } catch (e) {
                        console.warn('Failed to clear scanner during cleanup', e);
                    }
                } catch (err) {
                    console.error('Error during scanner cleanup', err);
                }
            }
        };
    }, []);

    // Initialize scanner when permission is granted and camera is selected
    useEffect(() => {
        if (hasPermission && selectedCamera && !isScanning) {
            const startScanner = async () => {
                try {
                    // Ensure element exists
                    if (!document.getElementById(regionId)) {
                        console.error('Scanner region element not found');
                        return;
                    }

                    if (!scannerRef.current) {
                        scannerRef.current = new Html5Qrcode(regionId, {
                            verbose: false
                        });
                    }

                    console.log('🔍 Starting scanner with optimized configuration...');
                    await scannerRef.current.start(
                        selectedCamera,
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                            // Optimization: Specify barcode formats to improve accuracy
                            formatsToSupport: [
                                // UPC formats
                                'UPC_A',
                                'UPC_E',
                                // EAN formats
                                'EAN_13',
                                'EAN_8',
                                // Common SKU formats (adjust based on your labels)
                                'CODE_128',
                                'CODE_39',
                                'CODE_93',
                                // QR codes (if needed)
                                'QR_CODE'
                            ],
                            // Use higher quality video stream
                            videoConstraints: {
                                facingMode: "environment",
                                width: { ideal: 1920 },
                                height: { ideal: 1080 },
                            }
                        },
                        (decodedText, decodedResult) => {
                            onScanSuccess(decodedText, decodedResult);
                        },
                        (errorMessage) => {
                            if (onScanFailure) {
                                onScanFailure(errorMessage);
                            }
                        }
                    );
                    setIsScanning(true);
                    setError('');
                } catch (err) {
                    console.error('Error starting scanner', err);
                    setError('Failed to start camera stream. Please try refreshing the page.');
                    setIsScanning(false);
                }
            };

            startScanner();
        }
    }, [hasPermission, selectedCamera]);

    const requestPermission = async () => {
        try {
            setError('');
            setPermissionRequested(true);

            // This will trigger the browser permission prompt
            const devices = await Html5Qrcode.getCameras();

            if (devices && devices.length) {
                setCameras(devices);

                // Try to find a back camera
                const backCamera = devices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear') ||
                    device.label.toLowerCase().includes('environment')
                );

                const cameraId = backCamera ? backCamera.id : devices[0].id;
                setSelectedCamera(cameraId);
                setHasPermission(true);
            } else {
                setError('No cameras found on this device.');
                setPermissionRequested(false);
            }
        } catch (err) {
            console.error('Error getting cameras', err);
            setError('Camera permission denied or not available. Please allow camera access to scan barcodes.');
            setPermissionRequested(false);
        }
    };

    const handleCameraChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCameraId = e.target.value;

        if (scannerRef.current && isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }

        setSelectedCamera(newCameraId);
        // The useEffect will pick up the change and restart the scanner
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {!hasPermission ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Camera Access Required</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Please allow access to your camera to scan barcodes.
                    </p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={requestPermission}
                            disabled={permissionRequested}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {permissionRequested ? 'Requesting...' : 'Request Camera Permissions'}
                        </button>
                    </div>
                    {error && (
                        <div className="mt-4 p-2 bg-red-50 rounded text-sm text-red-600 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-lg bg-black aspect-square">
                        <div id={regionId} className="w-full h-full" />
                        {!isScanning && !error && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <RefreshCw className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                    </div>

                    {cameras.length > 1 && (
                        <div className="flex justify-center">
                            <select
                                value={selectedCamera}
                                onChange={handleCameraChange}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                {cameras.map((camera) => (
                                    <option key={camera.id} value={camera.id}>
                                        {camera.label || `Camera ${camera.id.slice(0, 5)}...`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error && (
                        <div className="p-2 bg-red-50 rounded text-sm text-red-600 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
