import React, { useState, useEffect } from 'react'
import { salesAPI, summaryAPI, stockValuationAPI, salesTargetsAPI, expenseAnalyticsAPI } from '../utils/api'
import { useNotification } from './NotificationManager'

function Dashboard() {
  const { showError } = useNotification()
  const [loading, setLoading] = useState(true)
  const [stockValuation, setStockValuation] = useState(null)
  const [salesSummary, setSalesSummary] = useState({
    dailyTotal: 0,
    dailyProfit: 0,
    monthlyTotal: 0,
    monthlyProfit: 0,
  })
  const [salesTargets, setSalesTargets] = useState([])
  const [expenseAnalytics, setExpenseAnalytics] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [summaryData, valuationData, targetsData, analyticsData] = await Promise.all([
        summaryAPI.get().catch(() => ({ success: false })),
        stockValuationAPI.get().catch(() => ({ success: false })),
        salesTargetsAPI.getAll({ status: 'active' }).catch(() => ({ success: false, targets: [] })),
        expenseAnalyticsAPI.get().catch(() => ({ success: false }))
      ])

      if (summaryData.success) {
        setSalesSummary({
          dailyTotal: summaryData.dailySales || 0,
          dailyProfit: summaryData.dailyProfit || 0,
          monthlyTotal: summaryData.monthlySales || 0,
          monthlyProfit: summaryData.monthlyProfit || 0,
        })
      }

      if (valuationData.success) {
        setStockValuation(valuationData.valuation)
      }

      if (targetsData.success) {
        setSalesTargets(targetsData.targets || [])
      }

      if (analyticsData.success) {
        setExpenseAnalytics(analyticsData.analytics)
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      showError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateTargetProgress = (target) => {
    if (!target || target.targetAmount === 0) return 0
    return Math.min((target.currentAmount / target.targetAmount) * 100, 100)
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        <div className="text-center py-8">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">Dashboard</h2>

      {/* Sales Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Daily Sales</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            KSH {(salesSummary.dailyTotal || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Daily Profit</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
            KSH {(salesSummary.dailyProfit || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Monthly Sales</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            KSH {(salesSummary.monthlyTotal || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Monthly Profit</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
            KSH {(salesSummary.monthlyProfit || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Stock Valuation Widget */}
        {stockValuation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">Stock Valuation</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost Value</span>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  KSH {stockValuation.totalCostValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Retail Value</span>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  KSH {stockValuation.totalRetailValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Potential Profit</span>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  KSH {stockValuation.totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Average Margin</span>
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {stockValuation.averageMargin.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Products</span>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  {stockValuation.totalProducts} ({stockValuation.totalStock} units)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sales Targets Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">Active Sales Targets</h3>
          {salesTargets.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No active targets</p>
          ) : (
            <div className="space-y-4">
              {salesTargets.slice(0, 3).map((target) => {
                const progress = calculateTargetProgress(target)
                return (
                  <div key={target.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {target.type.charAt(0).toUpperCase() + target.type.slice(1)} Target
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress >= 100 ? 'bg-green-600' : progress >= 75 ? 'bg-blue-600' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>KSH {target.currentAmount.toFixed(2)}</span>
                      <span>KSH {target.targetAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expense Categories Analytics Widget */}
      {expenseAnalytics && expenseAnalytics.categoryBreakdown && expenseAnalytics.categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">Expense Categories</h3>
          <div className="space-y-3">
            {expenseAnalytics.categoryBreakdown.slice(0, 5).map((category, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.category}</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    KSH {category.total.toFixed(2)} ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {category.count} expense{category.count !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Expenses</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                KSH {expenseAnalytics.totalExpenses.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Average per Expense</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                KSH {expenseAnalytics.averageExpense.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

