import React, { useState } from 'react';

function Navbar({ user, setUser, toggleSidebar }) {
    const [isOpen, setIsOpen] = useState(false);
  
    const logout = () => {
      setUser(null);
      setIsOpen(false);
    };
  
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button onClick={toggleSidebar} className="p-2 text-gray-600 dark:text-gray-300 md:hidden">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800 dark:text-white">AdiletAI</span>
              </div>
            </div>
            {user && (
              <div className="flex items-center">
                <div className="relative">
                  <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2">
                    <img src="https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI=" alt="User" className="w-8 h-8 rounded-full" />
                    <span className="hidden md:block text-gray-700 dark:text-gray-300">{user.email}</span>
                  </button>
                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                      <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Выйти из системы
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }
  
  export default Navbar;