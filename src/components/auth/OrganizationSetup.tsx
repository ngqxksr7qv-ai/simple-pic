import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrganizationSetup: React.FC = () => {
    const { createOrganization, signOut, user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBack = async () => {
        await signOut();
        navigate('/login');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await createOrganization(orgName);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Redirect to dashboard
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-4 focus:outline-none"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Sign In
                    </button>
                    <div className="flex justify-center">
                        <Building2 className="h-12 w-12 text-indigo-600" />
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Set up your organization
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Create your store or business to start managing inventory
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                    <div>
                        <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-2">
                            Organization Name
                        </label>
                        <input
                            id="org-name"
                            name="org-name"
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g., Joe's Hardware Store"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            This is the name of your store or business. You can change it later.
                        </p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Organization'}
                        </button>
                    </div>
                </form>

                {/* Debug Info Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <details className="group">
                        <summary className="flex items-center text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                            <span className="mr-2">Debug Information</span>
                            <span className="text-xs text-gray-400">(Click to expand)</span>
                        </summary>
                        <div className="mt-4 bg-gray-50 p-4 rounded-md text-xs font-mono overflow-auto">
                            <div className="space-y-2">
                                <p><strong>User ID:</strong> {user?.id}</p>
                                <p><strong>Profile ID:</strong> {profile?.id}</p>
                                <p><strong>Org ID:</strong> {profile?.organization_id || 'null'}</p>
                                <p><strong>Profile Data:</strong></p>
                                <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                    {JSON.stringify(profile, null, 2)}
                                </pre>
                                <button
                                    onClick={() => refreshProfile()}
                                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Force Refresh Profile
                                </button>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default OrganizationSetup;
