import React, { useState, useEffect } from 'react'
import { productsAPI, suppliersAPI, priceHistoryAPI, salesAPI } from '../utils/api'
import CategoryItem from './CategoryItem'
import { useNotification } from './NotificationManager'

function InventoryManagement() {
  const { showError, showSuccess, showWarning, showConfirm, showInfo } = useNotification()
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // all, inStock, lowStock, outOfStock
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('name') // name, price, stock, category
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [priceHistory, setPriceHistory] = useState([])
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sales, setSales] = useState([])
  const [movementFilter, setMovementFilter] = useState('all') // all, fast, medium, slow
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    buyingPrice: '',
    stock: '',
    unitType: 'pcs',
    category: '',
    description: '',
    image: '',
    size: '',
    color: '',
    supplierId: '',
    supplierName: '',
  })

  useEffect(() => {
    loadProducts()
    loadSuppliers()
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      const data = await salesAPI.getAll()
      let salesList = []
      if (data && data.success && Array.isArray(data.sales)) {
        salesList = data.sales
      } else if (Array.isArray(data.sales)) {
        salesList = data.sales
      } else if (Array.isArray(data)) {
        salesList = data
      }
      setSales(Array.isArray(salesList) ? salesList : [])
    } catch (err) {
      console.error('Failed to load sales:', err)
      setSales([])
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await suppliersAPI.getAll()
      let suppliersList = []
      if (data && data.success && Array.isArray(data.suppliers)) {
        suppliersList = data.suppliers
      } else if (Array.isArray(data.suppliers)) {
        suppliersList = data.suppliers
      } else if (Array.isArray(data)) {
        suppliersList = data
      }
      setSuppliers(Array.isArray(suppliersList) ? suppliersList : [])
    } catch (err) {
      console.error('Failed to load suppliers:', err)
      setSuppliers([])
    }
  }

  const loadPriceHistory = async (productId) => {
    if (!productId) {
      setPriceHistory([])
      return
    }
    try {
      setLoadingPriceHistory(true)
      const data = await priceHistoryAPI.getAll({ productId })
      let historyArray = []
      if (data && data.success && Array.isArray(data.priceHistory)) {
        historyArray = data.priceHistory
      } else if (Array.isArray(data.priceHistory)) {
        historyArray = data.priceHistory
      } else if (Array.isArray(data)) {
        historyArray = data
      }
      setPriceHistory(Array.isArray(historyArray) ? historyArray : [])
    } catch (err) {
      console.error('Failed to load price history:', err)
      setPriceHistory([])
    } finally {
      setLoadingPriceHistory(false)
    }
  }

  const loadProducts = async (preserveScroll = false) => {
    try {
      // Save scroll position if we want to preserve it
      let scrollPosition = 0
      if (preserveScroll) {
        scrollPosition = window.pageYOffset || document.documentElement.scrollTop
      }
      
      setLoading(true)
      const data = await productsAPI.getAll()
      // Safely extract products array from API response
      let productsArray = []
      if (data && data.success && Array.isArray(data.products)) {
        productsArray = data.products
      } else if (Array.isArray(data.products)) {
        productsArray = data.products
      } else if (Array.isArray(data)) {
        productsArray = data
      }
      setProducts(Array.isArray(productsArray) ? productsArray : [])
      setError(null)
      
      // Restore scroll position after a brief delay to allow DOM to update
      if (preserveScroll) {
        setTimeout(() => {
          window.scrollTo(0, scrollPosition)
        }, 100)
      }
    } catch (err) {
      setError('Failed to load products. Please check your API configuration.')
      console.error(err)
      setProducts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name || '',
        price: product.price || '',
        buyingPrice: product.buyingPrice || '',
        stock: product.stock || '',
        unitType: product.unitType || 'pcs',
        category: product.category || '',
        description: product.description || '',
        image: product.image || '',
        size: product.size || '',
        color: product.color || '',
        supplierId: product.supplierId || '',
        supplierName: product.supplierName || '',
      })
      loadPriceHistory(product.id)
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        price: '',
        buyingPrice: '',
        stock: '',
        unitType: 'pcs',
        category: '',
        description: '',
        image: '',
        size: '',
        color: '',
        supplierId: '',
        supplierName: '',
      })
      setPriceHistory([])
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setPriceHistory([])
    setLoadingPriceHistory(false)
    setSubmitting(false)
    setFormData({
      name: '',
      price: '',
      buyingPrice: '',
      stock: '',
      unitType: 'pcs',
      category: '',
      description: '',
      image: '',
      size: '',
      color: '',
      supplierId: '',
      supplierName: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        buyingPrice: parseFloat(formData.buyingPrice) || 0,
        stock: parseInt(formData.stock),
        unitType: formData.unitType,
        category: formData.category,
        description: formData.description,
        image: formData.image,
        size: formData.size,
        color: formData.color,
        supplierId: formData.supplierId || '',
        supplierName: selectedSupplier ? selectedSupplier.name : '',
      }

      if (editingProduct) {
        // Check if price changed for price history
        const oldPrice = parseFloat(editingProduct.price) || 0
        const newPrice = parseFloat(productData.price) || 0
        const oldBuyingPrice = parseFloat(editingProduct.buyingPrice) || 0
        const newBuyingPrice = parseFloat(productData.buyingPrice) || 0
        
        // Ensure supplierId and supplierName are explicitly included in the update
        const updateData = {
          ...editingProduct,
          ...productData,
          supplierId: productData.supplierId || '',
          supplierName: productData.supplierName || '',
        }
        await productsAPI.update(editingProduct.id, updateData)
        
        // Reload price history if price changed
        if (oldPrice !== newPrice || oldBuyingPrice !== newBuyingPrice) {
          loadPriceHistory(editingProduct.id)
        }
      } else {
        await productsAPI.create(productData)
      }

      handleCloseModal()
      showSuccess(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
      loadProducts(true) // Preserve scroll position
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred'
      showError(`Failed to save product: ${errorMessage}. Check the browser console (F12) for more details.`)
      console.error('Product save error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this product?',
      async () => {
        try {
          await productsAPI.delete(id)
          loadProducts(true) // Preserve scroll position
          showSuccess('Product deleted successfully!')
        } catch (err) {
          showError('Failed to delete product. Please try again.')
          console.error(err)
        }
      }
    )
  }

  // Ensure products is always an array
  const productsArray = Array.isArray(products) ? products : []
  
  // Get low stock threshold from localStorage or use default
  const lowStockThreshold = parseInt(localStorage.getItem('lowStockThreshold')) || 5
  const lowStockProducts = Array.isArray(productsArray) ? productsArray.filter(p => (p.stock || 0) < lowStockThreshold) : []

  // Calculate shop value (total inventory value)
  const shopValue = Array.isArray(productsArray) ? productsArray.reduce((total, product) => {
    const buyingPrice = parseFloat(product.buyingPrice) || 0
    const stock = parseInt(product.stock) || 0
    return total + (buyingPrice * stock)
  }, 0) : 0

  // Get unique categories from existing products
  const existingCategories = Array.isArray(productsArray) ? [...new Set(productsArray
    .map(p => p.category)
    .filter(cat => cat && cat.trim() !== '')
  )].sort() : []

  // Category management functions
  const handleAddCategory = () => {
    if (newCategoryName.trim() && !existingCategories.includes(newCategoryName.trim())) {
      // Category will be available when a product is created/edited with this category
      setNewCategoryName('')
      showInfo(`Category "${newCategoryName.trim()}" will be available when you create or edit a product with this category.`)
    } else if (existingCategories.includes(newCategoryName.trim())) {
      showWarning('This category already exists!')
    }
  }

  const handleDeleteCategory = async (categoryToDelete) => {
    showConfirm(
      `Delete category "${categoryToDelete}"? Products with this category will be set to "Uncategorized".`,
      async () => {
        try {
          // Update all products with this category to remove it
          const productsToUpdate = productsArray.filter(p => p.category === categoryToDelete)
          for (const product of productsToUpdate) {
            await productsAPI.update(product.id, {
              ...product,
              category: ''
            })
          }
          loadProducts(true) // Preserve scroll position
          showSuccess(`Category "${categoryToDelete}" deleted. Products updated.`)
        } catch (err) {
          showError('Failed to delete category. Please try again.')
          console.error(err)
        }
      }
    )
  }

  const handleRenameCategory = async (oldCategory, newCategoryName) => {
    if (!newCategoryName.trim() || newCategoryName.trim() === oldCategory) {
      return
    }

    if (existingCategories.includes(newCategoryName.trim())) {
      showWarning('This category name already exists!')
      return
    }

    showConfirm(
      `Rename category "${oldCategory}" to "${newCategoryName.trim()}"?`,
      async () => {
        try {
          // Update all products with this category
          const productsToUpdate = productsArray.filter(p => p.category === oldCategory)
          for (const product of productsToUpdate) {
            await productsAPI.update(product.id, {
              ...product,
              category: newCategoryName.trim()
            })
          }
          loadProducts(true) // Preserve scroll position
          showSuccess('Category renamed successfully!')
        } catch (err) {
          showError('Failed to rename category. Please try again.')
          console.error(err)
        }
      }
    )
  }

  // Calculate product movement metrics (last 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
  
  const productMovement = {}
  const salesArray = Array.isArray(sales) ? sales : []
  
  salesArray.forEach(sale => {
    if (!sale.timestamp) return
    const saleDate = new Date(sale.timestamp)
    if (saleDate < thirtyDaysAgo) return // Skip sales older than 30 days
    
    if (Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        if (item.productId) {
          if (!productMovement[item.productId]) {
            productMovement[item.productId] = {
              quantitySold: 0,
              saleCount: 0
            }
          }
          productMovement[item.productId].quantitySold += (item.quantity || 0)
          productMovement[item.productId].saleCount += 1
        }
      })
    }
  })
  
  // Calculate percentiles for movement classification
  const allQuantities = Object.values(productMovement).map(m => m.quantitySold).sort((a, b) => a - b)
  const p33 = allQuantities.length > 0 ? allQuantities[Math.floor(allQuantities.length * 0.33)] : 0
  const p67 = allQuantities.length > 0 ? allQuantities[Math.floor(allQuantities.length * 0.67)] : 0
  
  // Classify product movement
  const getProductMovement = (productId) => {
    const movement = productMovement[productId]
    if (!movement || movement.quantitySold === 0) return 'slow'
    if (movement.quantitySold >= p67) return 'fast'
    if (movement.quantitySold >= p33) return 'medium'
    return 'slow'
  }

  // Filter products based on search, category, stock, price, and movement, then sort
  const filteredProducts = Array.isArray(productsArray) ? productsArray.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    
    // Stock filter
    const stock = product.stock || 0
    let matchesStock = true
    if (stockFilter === 'inStock') matchesStock = stock > lowStockThreshold
    else if (stockFilter === 'lowStock') matchesStock = stock > 0 && stock <= lowStockThreshold
    else if (stockFilter === 'outOfStock') matchesStock = stock === 0
    
    // Price range filter
    const price = parseFloat(product.price) || 0
    const matchesMinPrice = !priceRange.min || price >= parseFloat(priceRange.min)
    const matchesMaxPrice = !priceRange.max || price <= parseFloat(priceRange.max)
    
    // Movement filter
    let matchesMovement = true
    if (movementFilter !== 'all') {
      const movement = getProductMovement(product.id)
      matchesMovement = movement === movementFilter
    }
    
    return matchesSearch && matchesCategory && matchesStock && matchesMinPrice && matchesMaxPrice && matchesMovement
  }).sort((a, b) => {
    // Sort by selected option
    switch (sortBy) {
      case 'price':
        return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0) // High to low
      case 'priceAsc':
        return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0) // Low to high
      case 'stock':
        return (b.stock || 0) - (a.stock || 0) // High to low
      case 'stockAsc':
        return (a.stock || 0) - (b.stock || 0) // Low to high
      case 'category':
        const catA = (a.category || '').toLowerCase()
        const catB = (b.category || '').toLowerCase()
        return catA.localeCompare(catB)
      case 'name':
      default:
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        return nameA.localeCompare(nameB)
    }
  }) : []

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Inventory Management</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Shop Value Card */}
      <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-medium text-blue-100 dark:text-blue-200 mb-1">Total Shop Value</h3>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              KSH {shopValue.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-blue-100 dark:text-blue-200 mt-1">
              Total value of all inventory items
            </p>
          </div>
          <div className="text-4xl sm:text-5xl">💰</div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 text-yellow-700 dark:text-yellow-300 rounded">
          <div className="flex justify-between items-start">
            <div>
              <strong>⚠️ Low Stock Warning:</strong> {lowStockProducts.length} product(s) have stock below {lowStockThreshold} units.
              <p className="text-sm mt-1">Configure threshold in Notifications (bell icon)</p>
            </div>
            <button
              onClick={() => {
                setStockFilter('lowStock')
                setShowAdvancedFilters(true)
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Category Manager */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowCategoryManager(!showCategoryManager)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
        >
          {showCategoryManager ? 'Hide' : 'Manage'} Categories
        </button>
      </div>

      {showCategoryManager && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Category Management</h3>
          
          {/* Add New Category */}
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Add Category
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Existing Categories ({existingCategories.length})
            </h4>
            {existingCategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No categories yet. Add one above!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {existingCategories.map((category, index) => {
                  const productsInCategory = productsArray.filter(p => p.category === category).length
                  return (
                    <CategoryItem
                      key={index}
                      category={category}
                      productCount={productsInCategory}
                      onDelete={() => handleDeleteCategory(category)}
                      onRename={(newName) => handleRenameCategory(category, newName)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <input
              type="text"
              placeholder="Search products by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
            <div className="sm:w-48 sm:flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {existingCategories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-48 sm:flex-1">
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Movement</option>
                <option value="fast">Fast Moving</option>
                <option value="medium">Medium Moving</option>
                <option value="slow">Slow Moving</option>
              </select>
            </div>
            <div className="sm:w-48 sm:flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="price">Sort: Price (High-Low)</option>
                <option value="priceAsc">Sort: Price (Low-High)</option>
                <option value="stock">Sort: Stock (High-Low)</option>
                <option value="stockAsc">Sort: Stock (Low-High)</option>
                <option value="category">Sort: Category</option>
              </select>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="col-span-2 sm:col-span-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:text-white whitespace-nowrap"
            >
              {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Status
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="inStock">In Stock (&gt;{lowStockThreshold})</option>
                  <option value="lowStock">Low Stock (1-{lowStockThreshold})</option>
                  <option value="outOfStock">Out of Stock (0)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Price (KSH)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Price (KSH)
                </label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setPriceRange({ min: '', max: '' })
                  setStockFilter('all')
                  setMovementFilter('all')
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <>
          {/* Mobile Card View - Show on mobile and tablet, hide on large screens */}
          <div className="block lg:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {loading ? 'Loading products...' : 'No products found matching your search.'}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 ${
                    (product.stock || 0) < lowStockThreshold ? 'border-2 border-yellow-400' : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                        {(() => {
                          const movement = getProductMovement(product.id)
                          const movementData = productMovement[product.id]
                          if (!movementData || movementData.quantitySold === 0) {
                            return <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Slow</span>
                          }
                          if (movement === 'fast') {
                            return <span className="text-xs px-2 py-0.5 rounded bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200">Fast</span>
                          }
                          if (movement === 'medium') {
                            return <span className="text-xs px-2 py-0.5 rounded bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Medium</span>
                          }
                          return <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Slow</span>
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 dark:text-red-400 text-xs sm:text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Selling Price:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        KSH {product.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Buying Price:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        KSH {(parseFloat(product.buyingPrice) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                      <span className={`font-semibold ${(product.stock || 0) < lowStockThreshold ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock} {product.unitType || 'pcs'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Category:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {product.category || 'N/A'}
                      </span>
                    </div>
                    {product.supplierName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Supplier:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {product.supplierName}
                        </span>
                      </div>
                    )}
                    {(product.size || product.color) && (
                      <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">Variants:</span>
                        <span className="text-gray-900 dark:text-white text-right">
                          {[product.size, product.color].filter(Boolean).join(', ') || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View - Hidden on mobile and tablet */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Selling Price
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Buying Price
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Movement
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        {loading ? 'Loading products...' : 'No products found matching your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={(product.stock || 0) < lowStockThreshold ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        KSH {product.price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        KSH {(parseFloat(product.buyingPrice) || 0).toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={(product.stock || 0) < lowStockThreshold ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                          {product.stock} {product.unitType || 'pcs'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {product.size || product.color ? (
                          <div className="space-y-1">
                            {product.size && <div className="text-xs">Size: <span className="font-medium">{product.size}</span></div>}
                            {product.color && <div className="text-xs">Color: <span className="font-medium">{product.color}</span></div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <div>{product.category || 'N/A'}</div>
                          {product.supplierName && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              📦 {product.supplierName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          const movement = getProductMovement(product.id)
                          const movementData = productMovement[product.id]
                          if (!movementData || movementData.quantitySold === 0) {
                            return <span className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Slow</span>
                          }
                          if (movement === 'fast') {
                            return <span className="px-2 py-1 rounded text-xs bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200">Fast ({movementData.quantitySold} sold)</span>
                          }
                          if (movement === 'medium') {
                            return <span className="px-2 py-1 rounded text-xs bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Medium ({movementData.quantitySold} sold)</span>
                          }
                          return <span className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Slow ({movementData.quantitySold} sold)</span>
                        })()}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selling Price (KSH) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buying Price (KSH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.buyingPrice}
                    onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit Type *
                  </label>
                  <select
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters (L)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Image
                </label>
                <div className="space-y-2">
                  {/* Image Preview */}
                  {formData.image && (
                    <div className="mb-2">
                      <img 
                        src={formData.image} 
                        alt="Product preview" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="mt-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, image: reader.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center transition-colors">
                        📷 Take Photo
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, image: reader.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg text-center transition-colors">
                        📁 Upload Image
                      </div>
                    </label>
                  </div>
                  
                  {/* URL Input (fallback) */}
                  <div>
                    <input
                      type="url"
                      value={formData.image && formData.image.startsWith('http') ? formData.image : ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Or enter image URL (https://...)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Take a photo with your camera, upload from files, or enter an image URL
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="category-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Type or select a category"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <datalist id="category-suggestions">
                    {existingCategories.map((category, index) => (
                      <option key={index} value={category} />
                    ))}
                  </datalist>
                </div>
                {existingCategories.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Suggestions: {existingCategories.join(', ')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => {
                    const selectedSupplier = suppliers.find(s => s.id === e.target.value)
                    setFormData({
                      ...formData,
                      supplierId: e.target.value,
                      supplierName: selectedSupplier ? selectedSupplier.name : ''
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No Supplier (Optional)</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select supplier for this product. When stock runs low, you'll know which supplier to order from.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Size (Variant)
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., Small, Medium, Large"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color (Variant)
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Red, Blue, Black"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Price History Section - Only show when editing */}
              {editingProduct && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Price History</h4>
                  {loadingPriceHistory ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Loading price history...</p>
                  ) : priceHistory.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No price changes recorded yet.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {priceHistory.slice(0, 5).map((entry, index) => (
                        <div key={index} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                            {entry.reason && (
                              <span className="text-gray-500 dark:text-gray-500 text-xs italic">{entry.reason}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Selling Price: </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                KSH {entry.oldPrice.toFixed(2)} → KSH {entry.newPrice.toFixed(2)}
                              </span>
                            </div>
                            {entry.oldBuyingPrice !== entry.newBuyingPrice && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Buying Price: </span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  KSH {entry.oldBuyingPrice.toFixed(2)} → KSH {entry.newBuyingPrice.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {priceHistory.length > 5 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Showing 5 most recent. {priceHistory.length - 5} more...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingProduct ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement

