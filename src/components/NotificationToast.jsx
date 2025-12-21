import React, { useEffect, useState } from 'react'

function NotificationToast({ message, type = 'info', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      if (onClose) onClose()
    }, 300)
  }

  if (!isVisible) return null

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: '✓',
      iconBg: 'bg-green-100 dark:bg-green-900'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: '✕',
      iconBg: 'bg-red-100 dark:bg-red-900'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: '⚠',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'ℹ',
      iconBg: 'bg-blue-100 dark:bg-blue-900'
    }
  }

  const styles = typeStyles[type] || typeStyles.info

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div
        className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-start gap-3`}
      >
        <div className={`${styles.iconBg} ${styles.text} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm`}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${styles.text} text-sm font-medium break-words`}>
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default NotificationToast

