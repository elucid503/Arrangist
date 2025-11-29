import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CheckSquare, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { UseAuth } from '../Utils/AuthContext';

const NavLinks = [
  { Path: '/dashboard', Label: 'Dashboard', Icon: LayoutDashboard },
  { Path: '/tasks', Label: 'Tasks', Icon: CheckSquare },
  { Path: '/calendar', Label: 'Calendar', Icon: Calendar },
  { Path: '/settings', Label: 'Settings', Icon: Settings },
];

const Navbar: React.FC = () => {
  const Location = useLocation();
  const Navigate = useNavigate();
  const { User, Logout } = UseAuth();

  const HandleLogout = () => {
    Logout();
    Navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">SmartAssign</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-4">
              {NavLinks.map((link) => (
                <Link
                  key={link.Path}
                  to={link.Path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    Location.pathname === link.Path
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <link.Icon className="w-4 h-4 mr-2" />
                  {link.Label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">{User?.Name}</span>
            <button
              onClick={HandleLogout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Bottom navigation for mobile only
export const MobileBottomNav: React.FC = () => {
  const Location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        {NavLinks.map((link) => (
          <Link
            key={link.Path}
            to={link.Path}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${
              Location.pathname === link.Path
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <link.Icon className={`w-6 h-6 ${Location.pathname === link.Path ? 'scale-110' : ''} transition-transform`} />
            <span className="text-xs mt-1 font-medium">{link.Label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
