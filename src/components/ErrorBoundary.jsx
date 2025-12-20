import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    console.error('Error stack:', error.stack)
    console.error('Component stack:', errorInfo.componentStack)
    
    // Log more details about the error
    if (error.message) {
      console.error('Error message:', error.message)
      if (error.message.includes('filter')) {
        console.error('⚠️ FILTER ERROR DETECTED - This means .filter() was called on a non-array value')
        console.error('Check components that use .filter() - likely in SalesScreen, ProductDisplay, or InventoryManagement')
      }
      if (error.message.includes('map')) {
        console.error('⚠️ MAP ERROR DETECTED - This means .map() was called on a non-array value')
        console.error('Check components that use .map() - likely in SalesScreen, ProductDisplay, or InventoryManagement')
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error
      const errorMessage = error?.message || 'Unknown error'
      const isFilterError = errorMessage.includes('filter')
      const isMapError = errorMessage.includes('map')
      
      return (
        <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Something went wrong
          </h2>
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded p-4">
            <p className="font-semibold mb-2">Error: {errorMessage}</p>
            
            {(isFilterError || isMapError) && (
              <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 rounded">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  {isFilterError ? 'Filter Error' : 'Map Error'} Detected
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  This error occurs when trying to use {isFilterError ? '.filter()' : '.map()'} on a value that is not an array.
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Common causes:</strong>
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside mt-1 ml-2">
                  <li>API returned data in unexpected format</li>
                  <li>State variable is not initialized as an array</li>
                  <li>API call failed and returned null/undefined</li>
                </ul>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  <strong>Check browser console (F12) for:</strong>
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside mt-1 ml-2">
                  <li>"Products API Response:" - shows what the API returned</li>
                  <li>"Error stack:" - shows which component caused the error</li>
                  <li>"Component stack:" - shows the component hierarchy</li>
                </ul>
              </div>
            )}
            
            <p className="text-sm mt-3">Check the browser console (F12) for more details.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

