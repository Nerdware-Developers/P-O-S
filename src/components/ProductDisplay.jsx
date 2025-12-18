import React, { useState, useEffect } from 'react'
import { productsAPI, salesAPI } from '../utils/api'

function ProductDisplay() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sellingProduct, setSellingProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selling, setSelling] = useState(false)

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
      setError('Failed to load products. Please check your API configuration.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory && product.stock > 0
  })

  const handleSellProduct = async () => {
    if (!sellingProduct || quantity < 1 || quantity > sellingProduct.stock) {
      alert('Invalid quantity')
      return
    }

    try {
      setSelling(true)
      const taxRate = 0.08 // 8% tax
      const itemSubtotal = sellingProduct.price * quantity
      const itemTax = itemSubtotal * taxRate
      const itemTotal = itemSubtotal + itemTax
      const itemProfit = (sellingProduct.price - (sellingProduct.buyingPrice || 0)) * quantity

      // Create sale
      const sale = {
        items: [{
          productId: sellingProduct.id,
          productName: sellingProduct.name,
          quantity: quantity,
          price: sellingProduct.price,
          buyingPrice: sellingProduct.buyingPrice || 0,
          subtotal: itemSubtotal,
          profit: itemProfit,
        }],
        subtotal: itemSubtotal,
        tax: itemTax,
        total: itemTotal,
        profit: itemProfit,
        timestamp: new Date().toISOString(),
      }

      await salesAPI.create(sale)

      // Update product stock
      await productsAPI.update(sellingProduct.id, {
        ...sellingProduct,
        stock: sellingProduct.stock - quantity,
      })

      alert(`Successfully sold ${quantity} ${sellingProduct.unitType || 'pcs'} of ${sellingProduct.name}!`)
      setSellingProduct(null)
      setQuantity(1)
      loadProducts() // Reload to update stock
    } catch (err) {
      alert('Failed to complete sale. Please try again.')
      console.error(err)
    } finally {
      setSelling(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Product Catalog</h2>
        <p className="text-gray-600 dark:text-gray-400">Browse our available products</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">No products found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 ${product.image ? 'hidden' : ''}`}
                >
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {product.stock < 10 && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    Low Stock
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-2">
                  {product.category && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {product.category}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
                  {product.name}
                </h3>
                {(product.size || product.color) && (
                  <div className="flex gap-2 mb-2">
                    {product.size && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                        Size: {product.size}
                      </span>
                    )}
                    {product.color && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                        Color: {product.color}
                      </span>
                    )}
                  </div>
                )}
                {product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                {/* Price and Stock */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      KSH {product.price?.toFixed(2) || '0.00'}
                    </div>
                    {product.buyingPrice > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                        Cost: KSH {product.buyingPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Info and Sell Button */}
                <div className="flex items-center justify-between text-sm mt-3">
                  <span className={`font-medium ${
                    product.stock < 10 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {product.stock > 0 ? (
                      <>In Stock: {product.stock} {product.unitType || 'pcs'}</>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Out of Stock</span>
                    )}
                  </span>
                </div>
                {product.stock > 0 && (
                  <button
                    onClick={() => setSellingProduct(product)}
                    className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Sell Product
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sell Product Modal */}
      {sellingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Sell {sellingProduct.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity (Available: {sellingProduct.stock} {sellingProduct.unitType || 'pcs'})
                </label>
                <input
                  type="number"
                  min="1"
                  max={sellingProduct.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(sellingProduct.stock, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Price per unit:</span>
                  <span className="font-semibold">KSH {sellingProduct.price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Quantity:</span>
                  <span className="font-semibold">{quantity}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
                  <span className="text-gray-800 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    KSH {(sellingProduct.price * quantity).toFixed(2)}
                  </span>
                </div>
                {sellingProduct.buyingPrice > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400 border-t border-gray-300 dark:border-gray-600 pt-2">
                    <span>Profit:</span>
                    <span className="font-semibold">
                      KSH {((sellingProduct.price - sellingProduct.buyingPrice) * quantity).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSellingProduct(null)
                    setQuantity(1)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSellProduct}
                  disabled={selling}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {selling ? 'Processing...' : 'Confirm Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredProducts.length > 0 && (
        <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Showing {filteredProducts.length} of {products.filter(p => p.stock > 0).length} available products
        </div>
      )}
    </div>
  )
}

export default ProductDisplay

