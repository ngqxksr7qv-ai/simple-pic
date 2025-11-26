import React, { useState } from 'react';
import { useInventory } from '../store/InventoryContext';
import { User } from 'lucide-react';

interface CounterSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CounterSessionModal: React.FC<CounterSessionModalProps> = ({ isOpen, onClose }) => {
    const { setCounterName } = useInventory();
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setCounterName(name.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-center mb-6">
                    <div className="bg-indigo-100 p-3 rounded-full">
                        <User className="h-8 w-8 text-indigo-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Who is counting?
                </h2>
                <p className="text-center text-gray-500 mb-6">
                    Please enter your name or device ID to track your counts.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="counterName" className="block text-sm font-medium text-gray-700 mb-2">
                            Counter Name / Device ID
                        </label>
                        <input
                            type="text"
                            id="counterName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. John, Scanner 1, Aisle 4"
                            autoFocus
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors"
                    >
                        Start Counting
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CounterSessionModal;
