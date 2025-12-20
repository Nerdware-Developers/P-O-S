import React, { useState, useEffect } from 'react'
import { expensesAPI } from '../utils/api'

function ExpenseManagement() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
    status: 'paid', // 'paid' or 'pending'
  })

  const expenseCategories = [
    'Rent',
    'Utilities',
    'Salaries',
    'Supplies',
    'Marketing',
    'Transport',
    'Maintenance',
    'Other'
  ]

  const paymentMethods = ['Cash', 'M-Pesa', 'Airtel Money', 'Bank Transfer', 'Card', 'Other']

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await expensesAPI.getAll()
      console.log('Expenses API Response:', data)
      // Ensure expenses is always an array
      const expensesData = data.expenses || data || []
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
    } catch (err) {
      console.error('Expense loading error:', err)
      setError(`Failed to load expenses: ${err.message || 'Unknown error'}. Check browser console for details.`)
      setExpenses([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (expense = null) => {
      if (expense) {
      setEditingExpense(expense)
      setFormData({
        description: expense.description || '',
        category: expense.category || '',
        amount: expense.amount || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        paymentMethod: expense.paymentMethod || 'Cash',
        notes: expense.notes || '',
        status: expense.status || 'paid',
      })
    } else {
      setEditingExpense(null)
      setFormData({
        description: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        notes: '',
        status: 'paid',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExpense(null)
      setFormData({
        description: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        notes: '',
        status: 'paid',
      })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const expenseData = {
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        status: formData.status,
      }

      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, expenseData)
      } else {
        await expensesAPI.create(expenseData)
      }

      handleCloseModal()
      loadExpenses()
    } catch (err) {
      alert(`Failed to save expense: ${err.message}`)
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      await expensesAPI.delete(id)
      loadExpenses()
    } catch (err) {
      alert('Failed to delete expense. Please try again.')
      console.error(err)
    }
  }

  // Ensure expenses is always an array
  const expensesArray = Array.isArray(expenses) ? expenses : []
  
  // Calculate totals - with safety checks
  const totalExpenses = expensesArray.reduce((sum, exp) => sum + (exp?.amount || 0), 0)
  const todayExpenses = expensesArray.filter(exp => {
    if (!exp || !exp.date) return false
    try {
      const expDate = new Date(exp.date).toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]
      return expDate === today
    } catch (e) {
      return false
    }
  }).reduce((sum, exp) => sum + (exp?.amount || 0), 0)

  const expensesByCategory = expensesArray.reduce((acc, exp) => {
    if (!exp) return acc
    const cat = exp.category || 'Uncategorized'
    acc[cat] = (acc[cat] || 0) + (exp.amount || 0)
    return acc
  }, {})

  console.log('ExpenseManagement rendering', { loading, error, expensesCount: expensesArray.length, expenses: expensesArray })
  
  // Always render at least the header
  if (!expenses && !loading && !error) {
    console.warn('ExpenseManagement: No expenses data, loading, or error state')
  }
  
  // Separate pending and paid expenses
  const pendingExpenses = expensesArray.filter(exp => exp.status === 'pending' || !exp.status)
  const paidExpenses = expensesArray.filter(exp => exp.status === 'paid')
  const totalPending = pendingExpenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Expense Management</h2>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
        >
          + Add Expense
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          <strong>⚠️ Error:</strong> {error}
          <div className="mt-2 text-sm">
            <p><strong>Most likely cause:</strong> Google Apps Script needs to be redeployed with the new expense endpoints.</p>
            <p className="mt-1"><strong>Fix:</strong> Go to script.google.com → Your project → Deploy → Manage deployments → Edit → Deploy</p>
            <p className="mt-1">Check browser console (F12) for detailed error messages.</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Total Expenses</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">
            KSH {(totalExpenses || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Today's Expenses</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">
            KSH {(todayExpenses || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Pending Expenses</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            KSH {(totalPending || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Total Records</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            {expensesArray.length}
          </p>
        </div>
      </div>

      {/* Pending Expenses Section */}
      {pendingExpenses.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
            ⚠️ Pending Expenses ({pendingExpenses.length})
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {pendingExpenses.map((expense) => (
              <div key={expense.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-yellow-300 dark:border-yellow-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{expense.description}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {expense.category} • {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      KSH {expense.amount?.toFixed(2) || '0.00'}
                    </span>
                    <button
                      onClick={() => {
                        const updatedExpense = { ...expense, status: 'paid' }
                        handleOpenModal(updatedExpense)
                      }}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses by Category */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">Expenses by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <div key={category} className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{category}</div>
                <div className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400">
                  KSH {amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading expenses...</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {expensesArray.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No expenses recorded yet
              </div>
            ) : (
              expensesArray.map((expense) => (
                <div
                  key={expense.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 ${
                    expense.status === 'pending' ? 'border-2 border-yellow-400' : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{expense.description}</h3>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                    {expense.status === 'pending' && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs font-semibold">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Category:</span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        {expense.category || 'Uncategorized'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        KSH {expense.amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Payment:</span>
                      <span className="text-gray-900 dark:text-white">{expense.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleOpenModal(expense)}
                      className="flex-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="flex-1 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {expensesArray.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No expenses recorded yet
                      </td>
                    </tr>
                  ) : (
                    expensesArray.map((expense) => (
                      <tr key={expense.id} className={expense.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                            {expense.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
                          KSH {expense.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {expense.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            expense.status === 'pending' 
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}>
                            {expense.status === 'pending' ? 'Pending' : 'Paid'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenModal(expense)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (KSH) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {editingExpense ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseManagement

