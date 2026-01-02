import React, { useState, useEffect } from 'react'
import { salesTargetsAPI, salesAPI } from '../utils/api'
import { useNotification } from './NotificationManager'

function SalesTargets() {
  const { showSuccess, showError, showConfirm } = useNotification()
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTarget, setEditingTarget] = useState(null)
  const [formData, setFormData] = useState({
    type: 'daily',
    period: '',
    targetAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'active',
  })

  useEffect(() => {
    loadTargets()
  }, [])

  const loadTargets = async () => {
    try {
      setLoading(true)
      const data = await salesTargetsAPI.getAll()
      if (data.success) {
        setTargets(data.targets || [])
        await updateTargetProgress(data.targets || [])
      }
    } catch (err) {
      console.error('Error loading targets:', err)
      showError('Failed to load sales targets')
    } finally {
      setLoading(false)
    }
  }

  const updateTargetProgress = async (targetsToUpdate = null) => {
    try {
      const targetsList = targetsToUpdate || targets
      if (targetsList.length === 0) return

      // Get all sales
      const salesData = await salesAPI.getAll()
      let sales = []
      if (salesData.success && Array.isArray(salesData.sales)) {
        sales = salesData.sales
      } else if (Array.isArray(salesData.sales)) {
        sales = salesData.sales
      }

      // Update each target's current amount
      for (const target of targetsList) {
        if (target.status !== 'active') continue

        const startDate = new Date(target.startDate)
        const endDate = new Date(target.endDate)
        endDate.setHours(23, 59, 59, 999)

        let currentAmount = 0
        sales.forEach(sale => {
          if (!sale.timestamp) return
          const saleDate = new Date(sale.timestamp)
          if (saleDate >= startDate && saleDate <= endDate) {
            currentAmount += sale.total || sale.subtotal || 0
          }
        })

        if (currentAmount !== target.currentAmount) {
          try {
            await salesTargetsAPI.update(target.id, { currentAmount })
          } catch (e) {
            console.error('Error updating target progress:', e)
          }
        }
      }

      // Reload targets to get updated amounts
      if (!targetsToUpdate) {
        loadTargets()
      }
    } catch (err) {
      console.error('Error updating target progress:', err)
    }
  }

  const handleOpenModal = (target = null) => {
    if (target) {
      setEditingTarget(target)
      setFormData({
        type: target.type || 'daily',
        period: target.period || '',
        targetAmount: target.targetAmount || '',
        startDate: target.startDate || new Date().toISOString().split('T')[0],
        endDate: target.endDate || new Date().toISOString().split('T')[0],
        status: target.status || 'active',
      })
    } else {
      setEditingTarget(null)
      setFormData({
        type: 'daily',
        period: '',
        targetAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'active',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTarget(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const targetPayload = {
        type: formData.type,
        period: formData.period,
        targetAmount: parseFloat(formData.targetAmount) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      }

      if (editingTarget) {
        await salesTargetsAPI.update(editingTarget.id, targetPayload)
        showSuccess('Sales target updated successfully!')
      } else {
        await salesTargetsAPI.create(targetPayload)
        showSuccess('Sales target created successfully!')
      }

      handleCloseModal()
      loadTargets()
    } catch (err) {
      showError(`Failed to save target: ${err.message}`)
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this sales target?',
      async () => {
        try {
          await salesTargetsAPI.delete(id)
          loadTargets()
          showSuccess('Sales target deleted successfully!')
        } catch (err) {
          showError('Failed to delete target. Please try again.')
          console.error(err)
        }
      }
    )
  }

  const calculateProgress = (target) => {
    if (!target || target.targetAmount === 0) return 0
    return Math.min((target.currentAmount / target.targetAmount) * 100, 100)
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Sales Targets</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
        >
          + New Target
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading targets...</div>
      ) : targets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No sales targets yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {targets.map((target) => {
            const progress = calculateProgress(target)
            const isCompleted = progress >= 100
            const isOverdue = new Date(target.endDate) < new Date() && !isCompleted

            return (
              <div
                key={target.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 ${
                  isCompleted ? 'border-2 border-green-500' : isOverdue ? 'border-2 border-red-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      {target.type.charAt(0).toUpperCase() + target.type.slice(1)} Target
                    </h3>
                    {target.period && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{target.period}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      target.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {target.status}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isCompleted
                          ? 'bg-green-600'
                          : progress >= 75
                          ? 'bg-blue-600'
                          : progress >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      KSH {target.currentAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      KSH {target.targetAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Remaining</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      KSH {Math.max(0, target.targetAmount - target.currentAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <p>Start: {new Date(target.startDate).toLocaleDateString()}</p>
                  <p>End: {new Date(target.endDate).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(target)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(target.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {editingTarget ? 'Edit Sales Target' : 'New Sales Target'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Period/Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., January 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Amount (KSH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
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
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    {editingTarget ? 'Update' : 'Create'} Target
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

export default SalesTargets

