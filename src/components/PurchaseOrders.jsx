import React, { useState, useEffect } from 'react'
import { ordersAPI, suppliersAPI, productsAPI } from '../utils/api'
import { useNotification } from './NotificationManager'

function PurchaseOrders() {
  const { showError, showSuccess, showWarning, showConfirm } = useNotification()
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('')
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    items: [],
    status: 'pending',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    notes: '',
  })
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [ordersData, suppliersData, productsData] = await Promise.all([
        ordersAPI.getAll().catch(() => ({ orders: [] })),
        suppliersAPI.getAll().catch(() => ({ suppliers: [] })),
        productsAPI.getAll().catch(() => ({ products: [] })),
      ])

      // Extract orders
      let ordersList = []
      if (ordersData && ordersData.success && Array.isArray(ordersData.orders)) {
        ordersList = ordersData.orders
      } else if (Array.isArray(ordersData.orders)) {
        ordersList = ordersData.orders
      }

      // Extract suppliers
      let suppliersList = []
      if (suppliersData && suppliersData.success && Array.isArray(suppliersData.suppliers)) {
        suppliersList = suppliersData.suppliers
      } else if (Array.isArray(suppliersData.suppliers)) {
        suppliersList = suppliersData.suppliers
      }

      // Extract products
      let productsList = []
      if (productsData && productsData.success && Array.isArray(productsData.products)) {
        productsList = productsData.products
      } else if (Array.isArray(productsData.products)) {
        productsList = productsData.products
      }

      // Sort orders by date (newest first)
      ordersList.sort((a, b) => {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0
        return dateB - dateA
      })

      setOrders(ordersList)
      setSuppliers(suppliersList)
      setProducts(productsList)
    } catch (err) {
      setError('Failed to load data. Please check your API configuration.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order)
      setFormData({
        supplierId: order.supplierId || '',
        supplierName: order.supplierName || '',
        items: Array.isArray(order.items) ? order.items : [],
        status: order.status || 'pending',
        orderDate: order.orderDate || new Date().toISOString().split('T')[0],
        expectedDate: order.expectedDate || '',
        notes: order.notes || '',
      })
    } else {
      setEditingOrder(null)
      setFormData({
        supplierId: '',
        supplierName: '',
        items: [],
        status: 'pending',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        notes: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingOrder(null)
  }

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    setFormData({
      ...formData,
      supplierId: supplierId,
      supplierName: supplier ? supplier.name : '',
    })
  }

  const handleRemoveItem = (productId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.productId !== productId),
    })
  }

  const handleUpdateItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.supplierId) {
      showWarning('Please select a supplier')
      return
    }
    if (formData.items.length === 0) {
      showWarning('Please add at least one product to the order')
      return
    }

    try {
      if (editingOrder) {
        await ordersAPI.update(editingOrder.id, formData)
        showSuccess('Order updated successfully!')
      } else {
        await ordersAPI.create(formData)
        showSuccess('Order created successfully!')
      }
      handleCloseModal()
      loadData()
    } catch (err) {
      showError(`Failed to save order: ${err.message}`)
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this order?',
      async () => {
        try {
          await ordersAPI.delete(id)
          showSuccess('Order deleted successfully!')
          loadData()
        } catch (err) {
          showError('Failed to delete order. Please try again.')
          console.error(err)
        }
      }
    )
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        await ordersAPI.update(orderId, { ...order, status: newStatus })
        
        // If status changed to "received", update product stock
        if (newStatus === 'received' && order.status !== 'received') {
          if (Array.isArray(order.items) && order.items.length > 0) {
            for (const item of order.items) {
              try {
                const product = products.find(p => p.id === item.productId)
                if (product) {
                  const newStock = (product.stock || 0) + (item.quantity || 0)
                  await productsAPI.update(product.id, {
                    ...product,
                    stock: newStock
                  })
                }
              } catch (err) {
                console.error(`Failed to update stock for product ${item.productId}:`, err)
              }
            }
            showSuccess('Order marked as received. Product stock has been updated!')
          }
        }
        
        loadData()
      }
    } catch (err) {
      showError('Failed to update order status.')
      console.error(err)
    }
  }

  const addLowStockToOrder = (supplierId) => {
    const lowStockThreshold = parseInt(localStorage.getItem('lowStockThreshold')) || 5
    
    // Only get products that belong to this supplier AND are low on stock AND have a supplier assigned
    const lowStockProducts = products.filter(p => {
      const hasLowStock = (p.stock || 0) < lowStockThreshold
      const belongsToSupplier = p.supplierId === supplierId
      const hasSupplier = !!p.supplierId // Only products with suppliers
      return hasLowStock && belongsToSupplier && hasSupplier
    })
    
    if (lowStockProducts.length === 0) {
      showWarning('No low stock products found for this supplier. Make sure products are assigned to this supplier in Inventory Management.')
      return
    }

    const supplier = suppliers.find(s => s.id === supplierId)
    if (!supplier) {
      showError('Supplier not found')
      return
    }

    const items = lowStockProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      quantity: Math.max(lowStockThreshold - (product.stock || 0), 1), // Order enough to reach threshold, minimum 1
      price: product.buyingPrice || product.price || 0,
      buyingPrice: product.buyingPrice || product.price || 0,
    }))

    setFormData({
      supplierId: supplierId,
      supplierName: supplier.name,
      items: items,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      notes: `Auto-generated order for low stock items from ${supplier.name}`,
    })
    setShowModal(true)
  }

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  }) : []

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      return sum + ((item.price || item.buyingPrice || 0) * (item.quantity || 0))
    }, 0)
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Purchase Orders</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {suppliers.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addLowStockToOrder(e.target.value)
                  e.target.value = ''
                }
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Quick Order: Low Stock</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
          >
            + New Order
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Low Stock Products for Selected Supplier */}
      {selectedSupplierFilter && (() => {
        const lowStockThreshold = parseInt(localStorage.getItem('lowStockThreshold')) || 5
        const supplier = suppliers.find(s => s.id === selectedSupplierFilter)
        
        if (!supplier) return null
        
        // Get low stock products for this specific supplier
        const lowStockItems = products.filter(p => 
          (p.stock || 0) < lowStockThreshold && 
          p.supplierId === selectedSupplierFilter &&
          !!p.supplierId
        )
        
        return (
          <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                {supplier.name} - Low Stock Items
              </h3>
              <button
                onClick={() => setSelectedSupplierFilter('')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                title="Clear filter"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No low stock products found for this supplier.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Current Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {lowStockItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-sm text-red-600 dark:text-red-400 font-semibold">
                            {item.stock || 0} {item.unitType || 'pcs'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => addLowStockToOrder(selectedSupplierFilter)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Create Order for All ({lowStockItems.length} items)
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Low Stock by Supplier Summary - Only show when no supplier is selected */}
      {!selectedSupplierFilter && suppliers.length > 0 && (() => {
        const lowStockThreshold = parseInt(localStorage.getItem('lowStockThreshold')) || 5
        // Only get products that have suppliers assigned
        const allLowStockItems = products.filter(p => 
          (p.stock || 0) < lowStockThreshold && !!p.supplierId
        )
        
        if (allLowStockItems.length === 0) return null
        
        // Group low stock items by supplier
        const itemsBySupplier = {}
        
        allLowStockItems.forEach(item => {
          if (item.supplierId) {
            if (!itemsBySupplier[item.supplierId]) {
              itemsBySupplier[item.supplierId] = []
            }
            itemsBySupplier[item.supplierId].push(item)
          }
        })
        
        return (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Low Stock Items by Supplier</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Select a supplier from the dropdown above to see their low stock products
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Show suppliers with low stock items */}
              {Object.entries(itemsBySupplier).map(([supplierId, items]) => {
                const supplier = suppliers.find(s => s.id === supplierId)
                if (!supplier || items.length === 0) return null
                
                return (
                  <div
                    key={supplierId}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800 dark:text-white">{supplier.name}</h4>
                      <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold px-2 py-1 rounded">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {items.slice(0, 3).map(item => (
                        <div key={item.id}>
                          • {item.name} ({item.stock || 0} left)
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div>+ {items.length - 3} more...</div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedSupplierFilter(supplierId)}
                      className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading orders...</div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No orders found. Create your first purchase order!
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        Order #{order.id.substring(0, 8)}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        order.status === 'received' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        order.status === 'ordered' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {order.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Supplier: <span className="font-medium">{order.supplierName || 'N/A'}</span></div>
                      <div>Order Date: {order.orderDate || 'N/A'}</div>
                      {order.expectedDate && <div>Expected: {order.expectedDate}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="ordered">Ordered</option>
                      <option value="received">Received</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => handleOpenModal(order)}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <div>
                            <span className="font-medium text-gray-800 dark:text-white">{item.productName || 'Unknown'}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              Qty: {item.quantity || 0} × KSH {item.price?.toFixed(2) || item.buyingPrice?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-white">
                            KSH {((item.price || item.buyingPrice || 0) * (item.quantity || 0)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {order.notes && <div>Notes: {order.notes}</div>}
                  </div>
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    Total: KSH {calculateTotal(order.items || []).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {editingOrder ? 'Edit Order' : 'New Purchase Order'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Supplier *
                    </label>
                    <select
                      required
                      value={formData.supplierId}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="ordered">Ordered</option>
                      <option value="received">Received</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Order Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expected Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Order Items List */}
                {formData.items.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Items:</h4>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId)
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-800 dark:text-white">{item.productName}</span>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Buying Price: KSH {item.price?.toFixed(2) || item.buyingPrice?.toFixed(2) || '0.00'}
                                {product && (
                                  <span className="ml-2">(Current Stock: {product.stock || 0})</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white text-sm"
                              />
                              <span className="w-24 text-right font-semibold text-gray-800 dark:text-white">
                                KSH {((item.price || item.buyingPrice || 0) * item.quantity).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.productId)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>KSH {calculateTotal(formData.items).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    {editingOrder ? 'Update Order' : 'Create Order'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrders

