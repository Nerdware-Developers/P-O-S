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
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Expense Management</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            KSH {(totalExpenses || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Today's Expenses</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            KSH {(todayExpenses || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Records</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {expensesArray.length}
          </p>
        </div>
      </div>

      {/* Expenses by Category */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Expenses by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <div key={category} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">{category}</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expensesArray.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No expenses recorded yet
                    </td>
                  </tr>
                ) : (
                  expensesArray.map((expense) => (
                    <tr key={expense.id}>
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

