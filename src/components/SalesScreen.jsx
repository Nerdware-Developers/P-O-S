import React, { useState, useEffect } from 'react'
import { productsAPI, salesAPI } from '../utils/api'
import { useNotification } from './NotificationManager'
import { getCurrentUser } from '../utils/auth'

function SalesScreen() {
  const { showSuccess, showError, showWarning } = useNotification()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productsAPI.getAll()
      
      // Comprehensive logging to diagnose the actual response structure
      console.log('=== PRODUCTS API RESPONSE DEBUG ===')
      console.log('Raw response:', data)
      console.log('Response type:', typeof data)
      console.log('Is null/undefined?', data === null || data === undefined)
      if (data) {
        console.log('Response keys:', Object.keys(data))
        console.log('Response values:', Object.values(data))
        console.log('Full JSON:', JSON.stringify(data, null, 2))
        console.log('Has success property?', 'success' in data)
        console.log('Success value:', data.success)
        console.log('Has products property?', 'products' in data)
        console.log('Products value:', data.products)
        console.log('Has error property?', 'error' in data)
        console.log('Error value:', data.error)
        console.log('Products type:', Array.isArray(data.products) ? 'array' : typeof data.products)
        
        // Check for nested structures or unexpected properties
        if (typeof data === 'object' && data !== null) {
          const allKeys = Object.keys(data)
          console.log('All properties in response:', allKeys)
          allKeys.forEach(key => {
            const value = data[key]
            console.log(`  ${key}:`, {
              type: typeof value,
              isArray: Array.isArray(value),
              value: value,
              stringified: typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : value
            })
          })
        }
      }
      console.log('=== END DEBUG ===')
      
      // Check if response is null or undefined
      if (!data) {
        throw new Error('API returned null or undefined. Check API configuration.')
      }
      
      // Check if there's an error in the response (explicit error field or success: false)
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Check if success is explicitly false
      if (data.success === false) {
        const errorMsg = data.error || 'API request failed. Check API configuration and Google Sheets setup.'
        throw new Error(errorMsg)
      }
      
      // Safely extract products array from API response
      let productsArray = []
      
      // Expected structure: { success: true, products: [...] }
      if (data.success === true && Array.isArray(data.products)) {
        productsArray = data.products
        console.log('Using data.products (success=true)')
      } 
      // Fallback: products array directly in response
      else if (Array.isArray(data.products)) {
        productsArray = data.products
        console.log('Using data.products (array, no success flag)')
      } 
      // Fallback: response is directly an array
      else if (Array.isArray(data)) {
        productsArray = data
        console.log('Using data directly (array)')
      } 
      // Fallback: products is an object, convert to array
      else if (data.products && typeof data.products === 'object' && !Array.isArray(data.products)) {
        productsArray = Object.values(data.products)
        console.log('Converted products object to array')
      } 
      // Last resort: try to find any array in the response
      else {
        console.warn('Could not extract products from response:', data)
        console.warn('Response structure:', {
          keys: Object.keys(data),
          values: Object.values(data).map(v => typeof v),
          hasArray: Object.values(data).some(v => Array.isArray(v))
        })
        
        // Try to find any array in the response
        const arraysInResponse = Object.values(data).filter(v => Array.isArray(v))
        if (arraysInResponse.length > 0) {
          console.log('Found arrays in response:', arraysInResponse)
          productsArray = arraysInResponse[0] // Use first array found
          console.log('Using first array found in response')
        } else {
          // No products found and no error - might be empty sheet
          console.warn('No products array found in response. This might mean:')
          console.warn('1. The Products sheet is empty (add products in Inventory section)')
          console.warn('2. The API response format is unexpected')
          console.warn('3. There was an API error that wasn\'t properly formatted')
          productsArray = [] // Empty array is valid if sheet is empty
        }
      }
      
      console.log('Extracted products array:', productsArray, 'Length:', productsArray.length)
      if (productsArray.length > 0) {
        console.log('First product:', productsArray[0])
      }
      
      setProducts(Array.isArray(productsArray) ? productsArray : [])
      if (productsArray.length === 0) {
        console.warn('No products loaded. Check if products exist in Google Sheets.')
      }
    } catch (err) {
      const errorMessage = err.message || 'Unknown error'
      setError(`Failed to load products: ${errorMessage}. Please check your API configuration and browser console for details.`)
      console.error('Products API Error:', err)
      console.error('Error stack:', err.stack)
      setProducts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId, delta) => {
    if (!Array.isArray(cart)) {
      setCart([])
      return
    }
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (productId) => {
    if (!Array.isArray(cart)) {
      setCart([])
      return
    }
    setCart(cart.filter(item => item.id !== productId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showWarning('Cart is empty!')
      return
    }

    try {
      setCheckingOut(true)
      // Calculate profit for each item
      // Only calculate profit if buyingPrice is set and greater than 0
      const totalProfit = cart.reduce((sum, item) => {
        const buyingPrice = parseFloat(item.buyingPrice) || 0
        if (buyingPrice > 0) {
          return sum + ((item.price - buyingPrice) * item.quantity)
        }
        return sum + 0 // No profit if buying price is not set
      }, 0)

      const currentUser = getCurrentUser()
      const sale = {
        items: cart.map(item => {
          const buyingPrice = parseFloat(item.buyingPrice) || 0
          const itemProfit = buyingPrice > 0 ? ((item.price - buyingPrice) * item.quantity) : 0
          return {
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            buyingPrice: buyingPrice,
            subtotal: item.price * item.quantity,
            profit: itemProfit,
          }
        }),
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        profit: totalProfit,
        userId: currentUser?.id || '',
        userName: currentUser?.name || currentUser?.email || 'Unknown',
        timestamp: new Date().toISOString(),
      }

      await salesAPI.create(sale)
      
      // Update product stock
      for (const item of cart) {
        const product = products.find(p => p.id === item.id)
        if (product) {
          await productsAPI.update(item.id, {
            ...product,
            stock: product.stock - item.quantity,
          })
        }
      }

      showSuccess('Sale completed successfully!')
      setCart([])
      loadProducts() // Reload to update stock
    } catch (err) {
      showError('Failed to complete sale. Please try again.')
      console.error(err)
    } finally {
      setCheckingOut(false)
    }
  }

  // Get unique categories from products
  const categories = Array.isArray(products) ? ['all', ...new Set(products.map(p => p.category).filter(Boolean))] : ['all']

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    if (!product || !product.name) return false
    const searchLower = searchTerm.toLowerCase()
    const nameMatch = product.name.toLowerCase().includes(searchLower)
    const categoryMatch = product.category?.toLowerCase().includes(searchLower)
    const matchesSearch = nameMatch || categoryMatch
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    // Sort alphabetically by name
    const nameA = (a.name || '').toLowerCase()
    const nameB = (b.name || '').toLowerCase()
    return nameA.localeCompare(nameB)
  }) : []
  
  console.log('Products state:', products, 'Filtered:', filteredProducts)

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">Sales</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4">
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-sm sm:text-base">Loading products...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-2 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                      product.stock > 0
                        ? 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:shadow-md bg-white dark:bg-gray-700'
                        : 'border-red-300 dark:border-red-600 opacity-50 bg-gray-100 dark:bg-gray-800'
                    }`}
                    onClick={() => product.stock > 0 && addToCart(product)}
                  >
                    <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2">
                      {product.name}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                      KSH {product.price.toFixed(2)}
                    </div>
                    <div className={`text-xs ${product.stock > 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
                      Stock: {product.stock} {product.unitType || 'pcs'}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    {searchTerm ? (
                      <div>
                        <p>No products found matching "{searchTerm}"</p>
                        <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                          {Array.isArray(products) && products.length > 0 
                            ? `Try a different search term. ${products.length} product(s) available.`
                            : 'No products in database. Add products in the Inventory section.'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p>No products found</p>
                        <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                          {Array.isArray(products) && products.length === 0
                            ? 'No products in database. Add products in the Inventory section.'
                            : 'Check browser console (F12) for API errors or configuration issues.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 sticky top-16 sm:top-20">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">Cart</h3>
            
            {!Array.isArray(cart) || cart.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                Cart is empty
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                  {Array.isArray(cart) && cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-white text-sm">
                          {item.name}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          KSH {item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-gray-800 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-300 dark:border-gray-600 pt-4 space-y-2">
                  <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white">
                    <span>Total:</span>
                    <span>KSH {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="mt-4 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingOut ? 'Processing...' : 'Checkout'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesScreen

