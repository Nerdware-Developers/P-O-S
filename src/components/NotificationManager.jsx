import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import NotificationToast from './NotificationToast'

const NotificationContext = createContext(null)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message, type, duration }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration) => {
    return showNotification(message, 'success', duration)
  }, [showNotification])

  const showError = useCallback((message, duration) => {
    return showNotification(message, 'error', duration)
  }, [showNotification])

  const showWarning = useCallback((message, duration) => {
    return showNotification(message, 'warning', duration)
  }, [showNotification])

  const showInfo = useCallback((message, duration) => {
    return showNotification(message, 'info', duration)
  }, [showNotification])

  // Confirm dialog replacement
  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    const id = Date.now() + Math.random()
    
    const ConfirmDialog = () => {
      const [isVisible, setIsVisible] = useState(true)
      
      const handleConfirm = () => {
        setIsVisible(false)
        setTimeout(() => {
          removeNotification(id)
          if (onConfirm) onConfirm()
        }, 200)
      }
      
      const handleCancel = () => {
        setIsVisible(false)
        setTimeout(() => {
          removeNotification(id)
          if (onCancel) onCancel()
        }, 200)
      }
      
      if (!isVisible) return null
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Confirm Action
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    setNotifications(prev => [...prev, { id, component: ConfirmDialog }])
    return id
  }, [removeNotification])

  const contextValue = useMemo(() => ({
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    removeNotification,
  }), [showNotification, showSuccess, showError, showWarning, showInfo, showConfirm, removeNotification])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <>
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
          {notifications.map(notification => {
            if (!notification.component) {
              return (
                <div key={notification.id} className="pointer-events-auto">
                  <NotificationToast
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={() => removeNotification(notification.id)}
                  />
                </div>
              )
            }
            return null
          })}
        </div>
        {/* Render confirmation dialogs outside the pointer-events-none container */}
        {notifications.map(notification => {
          if (notification.component) {
            return <notification.component key={notification.id} />
          }
          return null
        })}
      </>
    </NotificationContext.Provider>
  )
}

