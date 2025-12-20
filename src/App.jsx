import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SalesScreen from './components/SalesScreen'
import InventoryManagement from './components/InventoryManagement'
import SalesReports from './components/SalesReports'
import ProductDisplay from './components/ProductDisplay'
import ExpenseManagement from './components/ExpenseManagement'
import AdvancedReports from './components/AdvancedReports'
import Login from './components/Login'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'
import { checkAuth, logout } from './utils/auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const authStatus = checkAuth()
    setIsAuthenticated(authStatus)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  // Get base path for GitHub Pages
  const basename = import.meta.env.PROD ? '/P-O-S' : ''

  return (
    <Router basename={basename}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<SalesScreen />} />
                <Route path="/inventory" element={<InventoryManagement />} />
                <Route path="/products" element={<ProductDisplay />} />
                <Route path="/expenses" element={<ExpenseManagement />} />
                <Route path="/reports" element={<SalesReports />} />
                <Route path="/analytics" element={<AdvancedReports />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
        <InstallPrompt />
      </div>
    </Router>
  )
}

export default App

