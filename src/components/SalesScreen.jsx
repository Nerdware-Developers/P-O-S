import React, { useState, useEffect } from 'react'
import { productsAPI, salesAPI } from '../utils/api'

function SalesScreen() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)

  const taxRate = 0.08 // 8% tax - adjust as needed

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productsAPI.getAll()
      setProducts(data.products || data || [])
      setError(null)
    } catch (err) {
      const errorMessage = err.message || 'Unknown error'
      setError(`Failed to load products: ${errorMessage}. Please check your API configuration and browser console for details.`)
      console.error('Products API Error:', err)
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
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * taxRate
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }

    try {
      setCheckingOut(true)
      // Calculate profit for each item
      const totalProfit = cart.reduce((sum, item) => {
        const buyingPrice = item.buyingPrice || 0
        return sum + ((item.price - buyingPrice) * item.quantity)
      }, 0)

      const sale = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          buyingPrice: item.buyingPrice || 0,
          subtotal: item.price * item.quantity,
          profit: (item.price - (item.buyingPrice || 0)) * item.quantity,
        })),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        profit: totalProfit,
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

      alert('Sale completed successfully!')
      setCart([])
      loadProducts() // Reload to update stock
    } catch (err) {
      alert('Failed to complete sale. Please try again.')
      console.error(err)
    } finally {
      setCheckingOut(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Sales</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      product.stock > 0
                        ? 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:shadow-md bg-white dark:bg-gray-700'
                        : 'border-red-300 dark:border-red-600 opacity-50 bg-gray-100 dark:bg-gray-800'
                    }`}
                    onClick={() => product.stock > 0 && addToCart(product)}
                  >
                    <div className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                      {product.name}
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                      KSH {product.price.toFixed(2)}
                    </div>
                    <div className={`text-xs ${product.stock > 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
                      Stock: {product.stock} {product.unitType || 'pcs'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sticky top-20">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Cart</h3>
            
            {cart.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                Cart is empty
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                  {cart.map((item) => (
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
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Subtotal:</span>
                    <span>KSH {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                    <span>KSH {calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span>Total:</span>
                    <span>KSH {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

