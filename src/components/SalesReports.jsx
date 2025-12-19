import React, { useState, useEffect } from 'react'
import { salesAPI, summaryAPI } from '../utils/api'

function SalesReports() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, today, month
  const [reportData, setReportData] = useState({
    dailyTotal: 0,
    dailyProfit: 0,
    monthlyTotal: 0,
    monthlyProfit: 0,
    topSelling: [],
  })

  useEffect(() => {
    loadSales()
    loadSummary()
    // Refresh summary every 5 seconds for real-time updates
    const interval = setInterval(loadSummary, 5000)
    return () => clearInterval(interval)
  }, [filter])

  const loadSummary = async () => {
    try {
      console.log('Loading summary...')
      const data = await summaryAPI.get()
      console.log('Summary API response:', data)
      if (data.success) {
        setReportData(prev => ({
          ...prev,
          dailyTotal: data.dailySales || 0,
          dailyProfit: data.dailyProfit || 0,
          monthlyTotal: data.monthlySales || 0,
          monthlyProfit: data.monthlyProfit || 0,
        }))
        console.log('Updated report data:', {
          dailyTotal: data.dailySales || 0,
          dailyProfit: data.dailyProfit || 0,
          monthlyTotal: data.monthlySales || 0,
          monthlyProfit: data.monthlyProfit || 0,
        })
      } else {
        console.error('Summary API returned success: false', data)
      }
    } catch (err) {
      console.error('Summary loading error:', err)
      // Calculate from sales data as fallback
      if (sales.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()
        
        const dailySales = sales.filter(sale => {
          if (!sale || !sale.timestamp) return false
          const saleDate = new Date(sale.timestamp).toISOString().split('T')[0]
          return saleDate === today
        })
        const dailyTotal = dailySales.reduce((sum, sale) => sum + (sale?.total || sale?.subtotal || 0), 0)
        const dailyProfit = dailySales.reduce((sum, sale) => sum + (sale?.profit || 0), 0)
        
        const monthlySales = sales.filter(sale => {
          if (!sale || !sale.timestamp) return false
          const saleDate = new Date(sale.timestamp)
          return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear
        })
        const monthlyTotal = monthlySales.reduce((sum, sale) => sum + (sale?.total || sale?.subtotal || 0), 0)
        const monthlyProfit = monthlySales.reduce((sum, sale) => sum + (sale?.profit || 0), 0)
        
        setReportData(prev => ({
          ...prev,
          dailyTotal,
          dailyProfit,
          monthlyTotal,
          monthlyProfit,
        }))
      }
    }
  }

  const loadSales = async () => {
    try {
      setLoading(true)
      setError(null)
      const filters = {}
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        filters.date = today
      } else if (filter === 'month') {
        const now = new Date()
        filters.month = now.getMonth() + 1
        filters.year = now.getFullYear()
      }
      
      console.log('Loading sales with filters:', filters)
      const data = await salesAPI.getAll(filters)
      console.log('Sales API Response:', data)
      const salesData = data.sales || data || []
      setSales(salesData)
      calculateReportData(salesData)
    } catch (err) {
      console.error('Sales loading error:', err)
      setError(`Failed to load sales data: ${err.message || 'Unknown error'}. Check browser console for details.`)
      setSales([])
      calculateReportData([])
    } finally {
      setLoading(false)
    }
  }

  const calculateReportData = (salesData) => {
    if (!Array.isArray(salesData)) {
      setReportData({
        dailyTotal: 0,
        dailyProfit: 0,
        monthlyTotal: 0,
        monthlyProfit: 0,
        topSelling: [],
      })
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      // Calculate daily total and profit
      const dailySales = salesData.filter(sale => {
        if (!sale || !sale.timestamp) return false
        try {
          const saleDate = new Date(sale.timestamp).toISOString().split('T')[0]
          return saleDate === today
        } catch (e) {
          return false
        }
      })
      const dailyTotal = dailySales.reduce((sum, sale) => sum + (sale?.total || 0), 0)
      const dailyProfit = dailySales.reduce((sum, sale) => sum + (sale?.profit || 0), 0)

      // Calculate monthly total and profit
      const monthlySales = salesData.filter(sale => {
        if (!sale || !sale.timestamp) return false
        try {
          const saleDate = new Date(sale.timestamp)
          return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear
        } catch (e) {
          return false
        }
      })
      const monthlyTotal = monthlySales.reduce((sum, sale) => sum + (sale?.total || 0), 0)
      const monthlyProfit = monthlySales.reduce((sum, sale) => sum + (sale?.profit || 0), 0)

      // Calculate top selling items
      const itemCounts = {}
      salesData.forEach(sale => {
        if (sale && sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            if (!item) return
            const key = item.productName || item.name
            if (key) {
              itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 0)
            }
          })
        }
      })
      const topSelling = Object.entries(itemCounts)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)

      setReportData({
        dailyTotal,
        dailyProfit,
        monthlyTotal,
        monthlyProfit,
        topSelling,
      })
    } catch (error) {
      console.error('Error calculating report data:', error)
      setReportData({
        dailyTotal: 0,
        dailyProfit: 0,
        monthlyTotal: 0,
        monthlyProfit: 0,
        topSelling: [],
      })
    }
  }

  const exportToCSV = () => {
    if (sales.length === 0) {
      alert('No sales data to export')
      return
    }

      const headers = ['Date', 'Items', 'Subtotal', 'Profit', 'Total']
    const rows = sales.map(sale => {
      const date = new Date(sale.timestamp).toLocaleString()
      const items = Array.isArray(sale.items) ? sale.items.map(i => `${i.productName || i.name} (${i.quantity || 0})`).join('; ') : (sale.items || 'N/A')
      return [
        date,
        items,
        sale.subtotal?.toFixed(2) || '0.00',
        sale.profit?.toFixed(2) || '0.00',
        sale.total?.toFixed(2) || '0.00',
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  console.log('SalesReports rendering', { loading, error, salesCount: sales.length, reportData })
  
  // Always render at least the header
  if (!sales && !loading && !error) {
    console.warn('SalesReports: No sales data, loading, or error state')
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Reports</h2>
        <div className="flex space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Sales</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
          <strong>⚠️ Error:</strong> {error}
          <div className="mt-2 text-sm">
            <p>Check browser console (F12) for detailed error messages.</p>
            <p className="mt-1">If the error persists, verify Google Apps Script is deployed correctly.</p>
            <p className="mt-1"><strong>Most likely cause:</strong> Google Apps Script needs to be redeployed with the updated schema (profit field in sales).</p>
            <p className="mt-1"><strong>Fix:</strong> Go to script.google.com → Your project → Deploy → Manage deployments → Edit → Deploy</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sales data...</p>
        </div>
      ) : (
        <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Daily Sales</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            KSH {(reportData.dailyTotal || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Daily Profit</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            KSH {(reportData.dailyProfit || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Monthly Sales</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            KSH {(reportData.monthlyTotal || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Monthly Profit</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            KSH {(reportData.monthlyProfit || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Top Selling Items */}
      {reportData.topSelling.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Top Selling Items</h3>
          <div className="space-y-2">
            {reportData.topSelling.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-800 dark:text-white">{item.name}</span>
                <span className="font-semibold text-gray-800 dark:text-white">{item.quantity} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subtotal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading sales data...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No sales data available
                  </td>
                </tr>
              ) : (
                sales.map((sale, index) => (
                  <tr key={sale.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sale.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {Array.isArray(sale.items) ? sale.items.map(i => `${i.productName || i.name} (${i.quantity || 0})`).join(', ') : (sale.items || 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      KSH {sale.subtotal?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      KSH {sale.profit?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      KSH {sale.total?.toFixed(2) || '0.00'}
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
    </div>
  )
}

export default SalesReports

