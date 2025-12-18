import React, { useState, useEffect } from 'react'
import { salesAPI, expensesAPI, productsAPI } from '../utils/api'

function AdvancedReports() {
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('month') // day, week, month

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading analytics data...')
      
      const [salesData, expensesData, productsData] = await Promise.all([
        salesAPI.getAll().catch(err => {
          console.error('Sales API error:', err)
          return { sales: [] }
        }),
        expensesAPI.getAll().catch(err => {
          console.error('Expenses API error:', err)
          return { expenses: [] }
        }),
        productsAPI.getAll().catch(err => {
          console.error('Products API error:', err)
          return { products: [] }
        })
      ])
      
      console.log('Analytics data loaded:', { salesData, expensesData, productsData })
      
      setSales(salesData.sales || salesData || [])
      setExpenses(expensesData.expenses || expensesData || [])
      setProducts(productsData.products || productsData || [])
    } catch (err) {
      console.error('Analytics loading error:', err)
      setError(`Failed to load data: ${err.message || 'Unknown error'}. Check browser console for details.`)
      setSales([])
      setExpenses([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Filter data by period
  const getFilteredData = (data, dateField = 'timestamp') => {
    const now = new Date()
    let startDate

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField] || item.date)
      return itemDate >= startDate
    })
  }

  const filteredSales = getFilteredData(sales)
  const filteredExpenses = getFilteredData(expenses, 'date')

  // Calculate metrics
  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const netProfit = totalProfit - totalExpenses

  // Sales by day
  const salesByDay = filteredSales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp).toLocaleDateString()
    acc[date] = (acc[date] || 0) + (sale.total || 0)
    return acc
  }, {})

  // Top selling products
  const productSales = {}
  filteredSales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const productId = item.productId || item.productName
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.productName || productId,
            quantity: 0,
            revenue: 0,
            profit: 0
          }
        }
        productSales[productId].quantity += item.quantity || 0
        productSales[productId].revenue += item.subtotal || 0
        productSales[productId].profit += item.profit || 0
      })
    }
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  // Sales by category
  const salesByCategory = {}
  filteredSales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId || p.name === item.productName)
        const category = product?.category || 'Uncategorized'
        salesByCategory[category] = (salesByCategory[category] || 0) + (item.subtotal || 0)
      })
    }
  })

  // Expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    const cat = exp.category || 'Uncategorized'
    acc[cat] = (acc[cat] || 0) + (exp.amount || 0)
    return acc
  }, {})

  // Helper function to create bar chart
  const BarChart = ({ data, maxValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      red: 'bg-red-600',
      yellow: 'bg-yellow-600'
    }

    if (!data || Object.keys(data).length === 0) {
      return <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>
    }

    const safeMaxValue = maxValue || 1

    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <div className="w-32 text-sm text-gray-700 dark:text-gray-300 truncate mr-2">
              {key}
            </div>
            <div className="flex-1">
              <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded">
                <div
                  className={`h-6 ${colorClasses[color]} rounded flex items-center justify-end pr-2`}
                  style={{ width: `${Math.min(100, (value / safeMaxValue) * 100)}%` }}
                >
                  <span className="text-xs text-white font-semibold">
                    KSH {value.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Advanced Reports & Analytics</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="day">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          <strong>Error:</strong> {error}
          <div className="mt-2 text-sm">
            <p>Possible causes:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Google Apps Script not redeployed with new endpoints</li>
              <li>API endpoints not configured correctly</li>
              <li>Check browser console (F12) for detailed error</li>
            </ul>
            <p className="mt-2">
              <strong>Solution:</strong> Go to Google Apps Script → Deploy → Manage deployments → Edit → Deploy
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      ) : (
        <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            KSH {totalSales.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Gross Profit</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            KSH {totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            KSH {totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Net Profit</h3>
          <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            KSH {netProfit.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Trend */}
        {Object.keys(salesByDay).length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Sales Trend</h3>
            <BarChart 
              data={salesByDay} 
              maxValue={Math.max(...Object.values(salesByDay)) || 1} 
              color="blue"
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Sales Trend</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sales data available for this period</p>
          </div>
        )}

        {/* Top Selling Products */}
        {topProducts.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-white">{product.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {product.quantity} sold • Profit: KSH {product.profit.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    KSH {product.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Top Selling Products</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No product sales data available</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        {Object.keys(salesByCategory).length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Sales by Category</h3>
            <BarChart 
              data={salesByCategory} 
              maxValue={Math.max(...Object.values(salesByCategory)) || 1} 
              color="green"
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Sales by Category</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No category sales data available</p>
          </div>
        )}

        {/* Expenses by Category */}
        {Object.keys(expensesByCategory).length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Expenses by Category</h3>
            <BarChart 
              data={expensesByCategory} 
              maxValue={Math.max(...Object.values(expensesByCategory)) || 1} 
              color="red"
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Expenses by Category</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No expense data available</p>
          </div>
        )}
      </div>

      {/* Profit Margin Analysis */}
      {topProducts.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Profit Margin Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Margin %</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topProducts.map((product, index) => {
                  const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">KSH {product.revenue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400">KSH {product.profit.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default AdvancedReports

