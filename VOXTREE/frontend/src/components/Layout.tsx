import React, { useState, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  CheckSquare,
  Clock,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Users,
  Target,
  Shield,
  BookOpen,
  Calculator,
  ArrowRightLeft,
  ListChecks,
  Tag,
  Smartphone,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProduct } from '../hooks/useProduct';
import TimeTracker from './TimeTracker';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { activeProduct, setActiveProduct } = useProduct();

  const voxtreeNavigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Documentation', href: '/documentation', icon: BookOpen },
    { name: 'Quotations', href: '/quotations', icon: Calculator },
    { name: 'Milestones', href: '/milestones', icon: Target },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Mobile App', href: '/download', icon: Smartphone },
  ];

  const voxdbookNavigation = [
    { name: 'Dashboard', href: '/voxdbook', icon: Home },
    { name: 'Transactions', href: '/voxdbook/transactions', icon: ArrowRightLeft },
    { name: 'Renewal Reminder', href: '/voxdbook/renewals', icon: RefreshCw },
    { name: 'Reminder', href: '/voxdbook/reminders', icon: BellRing },
    { name: 'Tasks', href: '/voxdbook/tasks', icon: CheckSquare },
    { name: 'Quick Todos', href: '/voxdbook/todos', icon: ListChecks },
    { name: 'Categories', href: '/voxdbook/categories', icon: Tag },
    { name: 'Mobile App', href: '/download', icon: Smartphone },
  ];

  const navigation = activeProduct === 'voxtree' ? voxtreeNavigation : voxdbookNavigation;

  const adminNavigation = [
    { name: 'Users & Roles', href: '/admin/users', icon: User },
    { name: 'Role Management', href: '/admin/roles', icon: Shield },
    { name: 'Quotation Settings', href: '/quotations/settings', icon: Calculator },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-8 w-8 ${activeProduct === 'voxtree' ? 'bg-primary-600' : 'bg-indigo-600'} rounded-lg flex items-center justify-center transition-colors`}>
                  <span className="text-white font-bold text-sm">
                    {activeProduct === 'voxtree' ? 'V' : 'S'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  {activeProduct === 'voxtree' ? 'VOXTREE' : 'VOXdBOOK'}
                </h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setActiveProduct('voxtree');
                  navigate('/');
                  setSidebarOpen(false);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeProduct === 'voxtree'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                VOXTREE
              </button>
              <button
                onClick={() => {
                  setActiveProduct('voxdbook');
                  navigate('/voxdbook');
                  setSidebarOpen(false);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeProduct === 'voxdbook'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                VOXdBOOK
              </button>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Section */}
            {(user?.role?.name === 'Founder' || user?.role?.name === 'ProjectManager' || user?.name === 'System Administrator') && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Administration
                </div>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <div className="flex-shrink-0">
              <div className={`h-8 w-8 ${activeProduct === 'voxtree' ? 'bg-primary-600' : 'bg-indigo-600'} rounded-lg flex items-center justify-center transition-colors`}>
                <span className="text-white font-bold text-sm">
                  {activeProduct === 'voxtree' ? 'V' : 'S'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">
                {activeProduct === 'voxtree' ? 'VOXTREE' : 'VOXdBOOK'}
              </h1>
            </div>
          </div>
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setActiveProduct('voxtree');
                  navigate('/');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeProduct === 'voxtree'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                VOXTREE
              </button>
              <button
                onClick={() => {
                  setActiveProduct('voxdbook');
                  navigate('/voxdbook');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeProduct === 'voxdbook'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                VOXdBOOK
              </button>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Section */}
            {(user?.role?.name === 'Founder' || user?.role?.name === 'ProjectManager' || user?.name === 'System Administrator') && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Administration
                </div>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200 lg:border-none">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1">
              <TimeTracker />
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* User menu */}
              <div className="relative ml-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.role?.name || 'Loading...'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default memo(Layout);