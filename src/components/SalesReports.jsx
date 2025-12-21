import React, { useState, useEffect } from 'react'
import { salesAPI, summaryAPI, usersAPI, closingsAPI } from '../utils/api'
import { useNotification } from './NotificationManager'

function SalesReports() {
  const { showWarning, showSuccess, showError } = useNotification()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('today') // all, today, month
  const [selectedUserId, setSelectedUserId] = useState('all') // all or specific user id
  // Get today's date in local timezone (YYYY-MM-DD format)
  const getTodayDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [selectedDate, setSelectedDate] = useState(getTodayDate()) // Selected date for viewing
  const [users, setUsers] = useState([])
  const [reportData, setReportData] = useState({
    dailyTotal: 0,
    dailyProfit: 0,
    monthlyTotal: 0,
    monthlyProfit: 0,
    topSelling: [],
  })
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [closingData, setClosingData] = useState({
    cash: '',
    float: '',
    mpesa: '',
    notes: '',
  })
  const [currentClosing, setCurrentClosing] = useState(null)
  const [allClosings, setAllClosings] = useState([])
  const [closingsLoading, setClosingsLoading] = useState(false)
  const [showClosingsHistory, setShowClosingsHistory] = useState(false)
  const [closingsFilter, setClosingsFilter] = useState('week') // week, month, all

  // Initialize date to today on mount
  useEffect(() => {
    const today = getTodayDate()
    setSelectedDate(today)
  }, [])

  useEffect(() => {
    loadUsers()
    loadSales()
    loadSummary()
    loadClosing()
    if (showClosingsHistory) {
      loadAllClosings()
    }
    // Refresh summary every 5 seconds for real-time updates
    const interval = setInterval(loadSummary, 5000)
    
    // Refresh data when a new day starts (check every minute)
    const dayCheckInterval = setInterval(() => {
      const now = new Date()
      const currentDay = now.getDate()
      const storedDay = localStorage.getItem('lastSalesReportDay')
      const todayStr = getTodayDate()
      
      if (storedDay && parseInt(storedDay) !== currentDay) {
        // New day has started, refresh sales data and reset date to today
        setSelectedDate(todayStr)
        loadSales()
        loadSummary()
        loadClosing()
        localStorage.setItem('lastSalesReportDay', currentDay.toString())
      } else if (!storedDay) {
        localStorage.setItem('lastSalesReportDay', currentDay.toString())
      }
    }, 60000) // Check every minute
    
    return () => {
      clearInterval(interval)
      clearInterval(dayCheckInterval)
    }
  }, [filter, selectedUserId, selectedDate, showClosingsHistory, closingsFilter])
  
  // Reload closings when filter changes
  useEffect(() => {
    if (showClosingsHistory) {
      loadAllClosings()
    }
  }, [closingsFilter])
  
  const loadClosing = async () => {
    try {
      const data = await closingsAPI.getAll({ date: selectedDate })
      if (data.success && data.closings && data.closings.length > 0) {
        const closing = data.closings[0] // Get the most recent closing for this date
        setCurrentClosing(closing)
        setClosingData({
          cash: closing.cash || '',
          float: closing.float || '',
          mpesa: closing.mpesa || '',
          notes: closing.notes || '',
        })
      } else {
        setCurrentClosing(null)
        setClosingData({
          cash: '',
          float: '',
          mpesa: '',
          notes: '',
        })
      }
    } catch (err) {
      console.error('Error loading closing:', err)
      setCurrentClosing(null)
    }
  }

  const loadAllClosings = async () => {
    setClosingsLoading(true)
    try {
      const data = await closingsAPI.getAll()
      if (data.success && data.closings) {
        let filtered = data.closings
        
        // Apply date filter
        const now = new Date()
        if (closingsFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(c => {
            const closingDate = new Date(c.date)
            return closingDate >= weekAgo
          })
        } else if (closingsFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(c => {
            const closingDate = new Date(c.date)
            return closingDate >= monthAgo
          })
        }
        // 'all' shows everything, no filtering needed
        
        setAllClosings(filtered)
      }
    } catch (err) {
      console.error('Error loading closings:', err)
      showError('Failed to load daily closings history')
    } finally {
      setClosingsLoading(false)
    }
  }
  
  const handleSaveClosing = async () => {
    try {
      const closingPayload = {
        date: selectedDate,
        cash: parseFloat(closingData.cash) || 0,
        float: parseFloat(closingData.float) || 0,
        mpesa: parseFloat(closingData.mpesa) || 0,
        notes: closingData.notes || '',
      }
      
      if (currentClosing) {
        await closingsAPI.update(currentClosing.id, closingPayload)
        showSuccess('Daily closing updated successfully!')
      } else {
        await closingsAPI.create(closingPayload)
        showSuccess('Daily closing saved successfully!')
      }
      
      setShowClosingModal(false)
      loadClosing()
    } catch (err) {
      showError(`Failed to save closing: ${err.message}`)
      console.error(err)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getAll()
      // Handle different response formats
      let usersList = []
      if (data && data.success && Array.isArray(data.users)) {
        usersList = data.users
      } else if (Array.isArray(data)) {
        usersList = data
      } else if (data && Array.isArray(data.users)) {
        usersList = data.users
      }
      setUsers(usersList)
    } catch (err) {
      console.error('Failed to load users:', err)
      setUsers([])
    }
  }

  const loadSummary = async (salesDataOverride = null) => {
    try {
      console.log('Loading summary...')
      const data = await summaryAPI.get()
      console.log('Summary API response:', data)
      
      // Always calculate daily sales from local sales data (backend uses UTC which causes timezone issues)
      // But use monthly data from API if available
      // When filter is 'today', use today's date. Otherwise use selectedDate
      const dateToUse = filter === 'today' ? getTodayDate() : selectedDate
      const [year, month, day] = dateToUse.split('-').map(Number)
      const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0) // Local midnight
      const dateStartTime = dateStart.getTime()
      const dateEndTime = dateStartTime + (24 * 60 * 60 * 1000) - 1
      
      // Use provided sales data or fall back to state
      const salesToUse = salesDataOverride || sales
      
      let dailyTotal = 0
      let dailyProfit = 0
      
      if (Array.isArray(salesToUse) && salesToUse.length > 0) {
        const dailySales = salesToUse.filter(sale => {
          if (!sale || !sale.timestamp) return false
          try {
            const saleDate = new Date(sale.timestamp)
            const saleTime = saleDate.getTime()
            // Check if sale is within selected date's range (local time)
            return saleTime >= dateStartTime && saleTime < dateEndTime
          } catch (e) {
            return false
          }
        })
        dailyTotal = dailySales.reduce((sum, sale) => sum + (sale?.total || sale?.subtotal || 0), 0)
        dailyProfit = dailySales.reduce((sum, sale) => sum + (sale?.profit || 0), 0)
      }
      
      // Use monthly data from API (or calculate if API failed)
      let monthlyTotal = 0
      let monthlyProfit = 0
      
      if (data.success) {
        monthlyTotal = data.monthlySales || 0
        monthlyProfit = data.monthlyProfit || 0
      } else {
        // Calculate monthly from sales data if API failed
        if (Array.isArray(salesToUse) && salesToUse.length > 0) {
          const currentMonth = now.getMonth() + 1
          const currentYear = now.getFullYear()
          const monthlySales = salesToUse.filter(sale => {
            if (!sale || !sale.timestamp) return false
            const saleDate = new Date(sale.timestamp)
            return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear
          })
          monthlyTotal = monthlySales.reduce((sum, sale) => sum + (sale?.total || sale?.subtotal || 0), 0)
          monthlyProfit = monthlySales.reduce((sum, sale) => sum + (sale?.profit || 0), 0)
        }
      }
      
        setReportData(prev => ({
          ...prev,
        dailyTotal,
        dailyProfit,
        monthlyTotal,
        monthlyProfit,
      }))
      
      console.log('Updated report data (daily from local, monthly from API):', {
        dailyTotal,
        dailyProfit,
        monthlyTotal,
        monthlyProfit,
      })
    } catch (err) {
      console.error('Summary loading error:', err)
      // Calculate everything from sales data as fallback
      const salesToUse = salesDataOverride || sales
      if (Array.isArray(salesToUse) && salesToUse.length > 0) {
        // When filter is 'today', use today's date. Otherwise use selectedDate
        const dateToUse = filter === 'today' ? getTodayDate() : selectedDate
        const [year, month, day] = dateToUse.split('-').map(Number)
        const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0) // Local midnight
        const todayStart = dateStart.getTime()
        const todayEnd = todayStart + (24 * 60 * 60 * 1000) - 1
        
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()
        
        const dailySales = salesToUse.filter(sale => {
          if (!sale || !sale.timestamp) return false
          try {
            const saleDate = new Date(sale.timestamp)
            const saleTime = saleDate.getTime()
            return saleTime >= todayStart && saleTime < todayEnd
          } catch (e) {
            return false
          }
        })
        const dailyTotal = dailySales.reduce((sum, sale) => sum + (sale?.total || sale?.subtotal || 0), 0)
        const dailyProfit = dailySales.reduce((sum, sale) => sum + (sale?.profit || 0), 0)
        
        const monthlySales = salesToUse.filter(sale => {
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
        // Use local date for filtering
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayStr = today.toISOString().split('T')[0]
        filters.date = todayStr
      } else if (filter === 'month') {
        const now = new Date()
        filters.month = now.getMonth() + 1
        filters.year = now.getFullYear()
      }
      
      // Add user filter if a specific user is selected
      if (selectedUserId && selectedUserId !== 'all') {
        filters.userId = selectedUserId
      }
      
      console.log('Loading sales with filters:', filters)
      const data = await salesAPI.getAll(filters)
      console.log('Sales API Response:', data)
      // Safely extract sales array from API response
      let salesData = []
      if (data && data.success && Array.isArray(data.sales)) {
        salesData = data.sales
      } else if (Array.isArray(data.sales)) {
        salesData = data.sales
      } else if (Array.isArray(data)) {
        salesData = data
      }
      
      // Sort sales by timestamp - most recent first (newest at top)
      if (Array.isArray(salesData)) {
        salesData.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return dateB - dateA // Descending order (newest first)
        })
      }
      
      const salesArray = Array.isArray(salesData) ? salesData : []
      setSales(salesArray)
      calculateReportData(salesArray)
      // Recalculate summary with new sales data (daily will use local time)
      // Pass sales data directly to avoid state timing issues
      loadSummary(salesArray)
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
      // When filter is 'today', use today's date. Otherwise use selectedDate
      const dateToUse = filter === 'today' ? getTodayDate() : selectedDate
      const [year, month, day] = dateToUse.split('-').map(Number)
      const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0) // Local midnight
      const dateStartTime = dateStart.getTime()
      const dateEndTime = dateStartTime + (24 * 60 * 60 * 1000) - 1
      
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Calculate daily total and profit - use dateToUse for comparison
      const dailySales = salesData.filter(sale => {
        if (!sale || !sale.timestamp) return false
        try {
          const saleDate = new Date(sale.timestamp)
          const saleTime = saleDate.getTime()
          // Check if sale is within date's range (local time)
          return saleTime >= dateStartTime && saleTime < dateEndTime
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

      // Calculate top selling items - only from selected date's sales
      const itemCounts = {}
      dailySales.forEach(sale => {
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
      showWarning('No sales data to export')
      return
    }

      const headers = ['Date', 'User', 'Items', 'Subtotal', 'Profit', 'Total']
    const rows = sales.map(sale => {
      const date = new Date(sale.timestamp).toLocaleString()
      const items = Array.isArray(sale.items) ? sale.items.map(i => `${i.productName || i.name} (${i.quantity || 0})`).join('; ') : (sale.items || 'N/A')
      return [
        date,
        sale.userName || sale.userId || 'Unknown',
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4">
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Sales Reports</h2>
        
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              // Load closing for the new date after state updates
              setTimeout(() => loadClosing(), 100)
            }}
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            title="Select date to view sales"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 sm:w-40 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Sales</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
          </select>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 sm:w-48 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Users</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={exportToCSV}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              loadClosing()
              setShowClosingModal(true)
            }}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Daily Closing
          </button>
          <button
            onClick={() => {
              setShowClosingsHistory(!showClosingsHistory)
              if (!showClosingsHistory) {
                loadAllClosings()
              }
            }}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {showClosingsHistory ? 'Hide' : 'View'} History
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Daily Sales</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            KSH {(reportData.dailyTotal || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Daily Profit</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
            KSH {(reportData.dailyProfit || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Monthly Sales</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            KSH {(reportData.monthlyTotal || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Monthly Profit</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
            KSH {(reportData.monthlyProfit || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Daily Closing Summary Card */}
      {currentClosing && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              Daily Closing - {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <button
              onClick={() => {
                loadClosing()
                setShowClosingModal(true)
              }}
              className="px-3 sm:px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Cash</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                KSH {(currentClosing.cash || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Float</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                KSH {(currentClosing.float || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">M-Pesa</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                KSH {(currentClosing.mpesa || 0).toFixed(2)}
              </p>
            </div>
          </div>
          {currentClosing.notes && (
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Notes:</span> {currentClosing.notes}
              </p>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Total: KSH {((currentClosing.cash || 0) + (currentClosing.float || 0) + (currentClosing.mpesa || 0)).toFixed(2)}
          </div>
        </div>
      )}

      {/* Daily Closings History */}
      {showClosingsHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              Daily Closings History
            </h3>
            <select
              value={closingsFilter}
              onChange={(e) => {
                setClosingsFilter(e.target.value)
              }}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          {closingsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading closings...</p>
            </div>
          ) : allClosings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No daily closings found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cash
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Float
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      M-Pesa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {allClosings.map((closing) => {
                    const total = (closing.cash || 0) + (closing.float || 0) + (closing.mpesa || 0)
                    return (
                      <tr key={closing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(closing.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          KSH {(closing.cash || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          KSH {(closing.float || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          KSH {(closing.mpesa || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          KSH {total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {closing.notes || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Top Selling Items */}
      {reportData.topSelling.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">Top Selling Items</h3>
          <div className="space-y-2">
            {reportData.topSelling.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm sm:text-base text-gray-800 dark:text-white truncate pr-2">{item.name}</span>
                <span className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white flex-shrink-0">{item.quantity} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: '600px' }}>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Items
                </th>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Subtotal
                </th>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Profit
                </th>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-2 sm:px-4 lg:px-6 py-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Loading sales data...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-2 sm:px-4 lg:px-6 py-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    No sales data available
                  </td>
                </tr>
              ) : (() => {
                // When filter is 'today', use today's date. Otherwise use selectedDate
                const dateToUse = filter === 'today' ? getTodayDate() : selectedDate
                // Filter sales to show date's sales - parse date string properly for local time
                const [year, month, day] = dateToUse.split('-').map(Number)
                const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0) // Local midnight
                const dateStartTime = dateStart.getTime()
                const dateEndTime = dateStartTime + (24 * 60 * 60 * 1000) - 1
                
                const filteredSales = sales.filter(sale => {
                  if (!sale || !sale.timestamp) return false
                  try {
                    const saleDate = new Date(sale.timestamp)
                    const saleTime = saleDate.getTime()
                    return saleTime >= dateStartTime && saleTime < dateEndTime
                  } catch (e) {
                    return false
                  }
                })
                
                if (filteredSales.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="px-2 sm:px-4 lg:px-6 py-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        No sales for {new Date(dateToUse).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                }
                
                return filteredSales.map((sale, index) => (
                  <tr key={sale.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <span className="block sm:hidden">{new Date(sale.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="hidden sm:block">{new Date(sale.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <span className="truncate block max-w-[60px] sm:max-w-[100px] md:max-w-none">
                        {sale.userName || sale.userId || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-[150px] sm:max-w-none">
                      <span className="line-clamp-2 sm:line-clamp-none break-words">
                        {Array.isArray(sale.items) ? sale.items.map(i => `${i.productName || i.name} (${i.quantity || 0})`).join(', ') : (sale.items || 'N/A')}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">KSH {sale.subtotal?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-[10px] xs:text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                      KSH {sale.profit?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-[10px] xs:text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      KSH {sale.total?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Daily Closing Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Daily Closing - {new Date(selectedDate).toLocaleDateString()}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cash Amount (KSH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingData.cash}
                    onChange={(e) => setClosingData({ ...closingData, cash: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Float Amount (KSH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingData.float}
                    onChange={(e) => setClosingData({ ...closingData, float: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    M-Pesa Amount (KSH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingData.mpesa}
                    onChange={(e) => setClosingData({ ...closingData, mpesa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={closingData.notes}
                    onChange={(e) => setClosingData({ ...closingData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveClosing}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {currentClosing ? 'Update' : 'Save'} Closing
                </button>
                <button
                  onClick={() => {
                    setShowClosingModal(false)
                    loadClosing()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesReports

