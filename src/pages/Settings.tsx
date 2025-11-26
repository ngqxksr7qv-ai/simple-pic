import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../store/InventoryContext';
import { Save, AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

const Settings: React.FC = () => {
    const { organization, updateOrganization, user, updateEmail, updatePassword } = useAuth();
    const { resetCounts, deleteAllProducts } = useInventory();

    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (organization?.name) {
            setOrgName(organization.name);
        }
        if (user?.email) {
            setEmail(user.email);
        }
    }, [organization, user]);

    const handleUpdateOrgName = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const { error } = await updateOrganization(orgName);

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update organization name.' });
        } else {
            setMessage({ type: 'success', text: 'Organization name updated successfully.' });
        }
        setIsSaving(false);
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const { error } = await updateEmail(email);

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update email. ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Email update initiated. Please check your new email for a confirmation link.' });
        }
        setIsSaving(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        const { error } = await updatePassword(password);

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update password. ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Password updated successfully.' });
            setPassword('');
            setConfirmPassword('');
        }
        setIsSaving(false);
    };

    const handleResetCounts = async () => {
        if (window.confirm('Are you sure you want to RESET ALL COUNTS to 0? This cannot be undone.')) {
            try {
                await resetCounts();
                alert('All counts have been reset to 0.');
            } catch (error) {
                alert('Failed to reset counts.');
            }
        }
    };

    const handleDeleteAllProducts = async () => {
        const confirmText = "DELETE ALL";
        const input = window.prompt(`DANGER: This will remove ALL products and counts from the database.\n\nTo confirm, type "${confirmText}" below:`);

        if (input === confirmText) {
            try {
                await deleteAllProducts();
                alert('All products have been permanently deleted.');
            } catch (error) {
                alert('Failed to delete products.');
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

            {/* Organization Settings */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Settings</h3>
                <form onSubmit={handleUpdateOrgName} className="space-y-4">
                    <div>
                        <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
                            Organization Name
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="text"
                                id="orgName"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="My Organization"
                            />
                            <button
                                type="submit"
                                disabled={isSaving || !orgName.trim() || orgName === organization?.name}
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                                <Save className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    {message && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </div>

            {/* User Settings */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Settings</h3>

                {/* Update Email */}
                <form onSubmit={handleUpdateEmail} className="space-y-4 mb-8">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isSaving || !email || email === user?.email}
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Update Email'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Update Password */}
                <form onSubmit={handleUpdatePassword} className="space-y-4 border-t border-gray-200 pt-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Leave blank to keep current password"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isSaving || !password || password !== confirmPassword}
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-red-200">
                <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
                </div>
                <div className="p-6 space-y-6">
                    {/* Reset Counts */}
                    <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                        <div>
                            <h4 className="text-base font-medium text-gray-900">Reset All Counts</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Sets the "Counted" quantity for all products to 0. Products are preserved.
                            </p>
                        </div>
                        <button
                            onClick={handleResetCounts}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Counts
                        </button>
                    </div>

                    {/* Delete All Products */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-medium text-gray-900">Delete All Products</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Permanently removes ALL products and their counts from the database.
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteAllProducts}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
