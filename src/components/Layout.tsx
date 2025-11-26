import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScanLine, Package, Menu, X, LogOut, Settings as SettingsIcon, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const location = useLocation();
    const { organization, signOut } = useAuth();

    // Save sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Count', href: '/count', icon: ScanLine },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        await signOut();
    };

    const sidebarWidth = isSidebarCollapsed ? 'w-20' : 'w-64';
    const contentPadding = isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64';

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar for Desktop */}
            <div className={`hidden md:flex md:${sidebarWidth} md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 transition-all duration-300`}>
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 bg-indigo-600 relative">
                        {isSidebarCollapsed ? (
                            <img src="/logo.png" alt="Logo" className="h-10 w-10" />
                        ) : (
                            <h1 className="text-xl font-bold text-white">Physical Inventory Count</h1>
                        )}
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute top-20 -right-3 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 z-10"
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isSidebarCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                        ) : (
                            <ChevronLeft className="h-4 w-4 text-gray-600" />
                        )}
                    </button>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                                    title={isSidebarCollapsed ? item.name : ''}
                                >
                                    <Icon
                                        className={`flex-shrink-0 h-6 w-6 ${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                            } ${isSidebarCollapsed ? '' : 'mr-3'}`}
                                    />
                                    {!isSidebarCollapsed && item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Manual Link */}
                    <div className="px-2 pb-4">
                        <a
                            href="/user-manual.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${isSidebarCollapsed ? 'justify-center' : ''
                                }`}
                            title={isSidebarCollapsed ? 'User Manual' : ''}
                        >
                            <BookOpen className={`flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                            {!isSidebarCollapsed && 'User Manual'}
                        </a>
                    </div>

                    {/* Organization info and logout */}
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <div className={`flex items-center w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                            {!isSidebarCollapsed && (
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{organization?.name}</p>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className={`p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md ${isSidebarCollapsed ? '' : 'ml-3'}`}
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-indigo-600 h-16 flex items-center justify-between px-4 shadow-md">
                <div className="flex items-center">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 mr-2" />
                    <h1 className="text-xl font-bold text-white">Inventory</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-20 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
                            <img src="/logo.png" alt="Logo" className="h-8 w-8 mr-2" />
                            <h1 className="text-xl font-bold text-white">Menu</h1>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="flex-1 px-2 py-4 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive(item.href)
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon
                                            className={`mr-4 flex-shrink-0 h-6 w-6 ${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                        {/* User Manual Link */}
                        <div className="px-2 pb-4 border-t border-gray-200 pt-4">
                            <a
                                href="/user-manual.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <BookOpen className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                                User Manual
                            </a>
                        </div>
                        {/* Mobile logout */}
                        <div className="flex-shrink-0 border-t border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                                    title="Logout"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 flex flex-col ${contentPadding} transition-all duration-300`}>
                <main className="flex-1 pt-16 md:pt-0 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
