import React, { useState, useEffect } from 'react'

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if running as PWA
    if (window.navigator.standalone === true) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: Show manual installation instructions
      showManualInstructions()
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    let instructions = ''
    
    if (isIOS) {
      instructions = `
📱 iOS Installation:
1. Tap the Share button (square with arrow) at the bottom
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" in the top right
4. The app will appear on your home screen!
      `
    } else if (isAndroid) {
      instructions = `
📱 Android Installation:
1. Tap the menu (3 dots) in your browser
2. Tap "Add to Home screen" or "Install app"
3. Tap "Add" or "Install"
4. The app will appear on your home screen!
      `
    } else {
      instructions = `
📱 Installation:
1. Look for an install icon in your browser's address bar
2. Or use your browser's menu to "Install" or "Add to Home Screen"
3. Follow the prompts to install
      `
    }
    
    alert(instructions)
  }

  // Always show manual install option on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (isInstalled) {
    return null
  }

  // Show manual install button if no automatic prompt
  if (!showPrompt && isMobile) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50">
        <div className="bg-blue-600 dark:bg-blue-700 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-white text-sm font-medium mb-1">Install App</p>
              <p className="text-blue-100 text-xs">Tap for installation instructions</p>
            </div>
            <button
              onClick={showManualInstructions}
              className="ml-3 px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              Install POS App
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add to your home screen for quick access!
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Install Now
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt

