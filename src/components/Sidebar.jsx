import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Sales', icon: '🛒' },
    { path: '/products', label: 'Products', icon: '🛍️' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/expenses', label: 'Expenses', icon: '💰' },
    { path: '/reports', label: 'Reports', icon: '📊' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-8 md:hidden">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

