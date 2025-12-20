// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL'
const API_KEY = import.meta.env.VITE_API_KEY || 'YOUR_API_KEY'

// Validate configuration
if (API_BASE_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' || !API_BASE_URL) {
  console.error('❌ API_BASE_URL is not configured!')
  console.error('Create a .env file with: VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec')
  console.error('See ENV_SETUP.md for instructions')
}

if (API_KEY === 'YOUR_API_KEY' || !API_KEY) {
  console.error('❌ API_KEY is not configured!')
  console.error('Create a .env file with: VITE_API_KEY=your_api_key_here')
  console.error('See ENV_SETUP.md for instructions')
}

// Validate API key format - it should NOT be a URL
if (API_KEY && API_KEY !== 'YOUR_API_KEY' && API_KEY.startsWith('http')) {
  console.error('❌ CRITICAL ERROR: API_KEY appears to be set to a URL instead of the actual key!')
  console.error('   Current value starts with:', API_KEY.substring(0, 30) + '...')
  console.error('   The API_KEY should be a random string, NOT the API URL')
  console.error('   Check your .env file or GitHub Secrets - VITE_API_KEY should be the key from GoogleAppsScript/Code.gs line 17')
  throw new Error('API_KEY is incorrectly set to a URL. It should be the secret key from GoogleAppsScript/Code.gs, not the API URL.')
}

// Validate API URL format
if (API_BASE_URL && API_BASE_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' && !API_BASE_URL.startsWith('https://script.google.com')) {
  console.warn('⚠️  API_BASE_URL does not look like a Google Apps Script URL')
  console.warn('   Expected format: https://script.google.com/macros/s/.../exec')
  console.warn('   Current value:', API_BASE_URL.substring(0, 50) + '...')
}

// Debug: Log API configuration (ALWAYS log in production to help debug deployment issues)
console.log('🔍 API Configuration Check:', {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  hasUrl: !!API_BASE_URL && API_BASE_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',
  hasKey: !!API_KEY && API_KEY !== 'YOUR_API_KEY',
  urlPreview: API_BASE_URL?.substring(0, 80) + '...',
  urlIsPlaceholder: API_BASE_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',
  keyIsPlaceholder: API_KEY === 'YOUR_API_KEY',
  keyStartsWithHttp: API_KEY?.startsWith('http') || false,
  envViteApiUrl: import.meta.env.VITE_API_URL ? 'SET' : 'NOT SET',
  envViteApiKey: import.meta.env.VITE_API_KEY ? 'SET (***' + import.meta.env.VITE_API_KEY.slice(-4) + ')' : 'NOT SET'
})

if (API_BASE_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' || !API_BASE_URL) {
  console.error('❌ CRITICAL: API_BASE_URL is using default placeholder!')
  if (import.meta.env.DEV) {
    console.error('   This means Vite did not load VITE_API_URL from .env file')
    console.error('   Make sure:')
    console.error('   1. .env file exists in project root')
    console.error('   2. .env file has: VITE_API_URL=https://...')
    console.error('   3. Dev server was restarted after creating/editing .env')
  } else {
    console.error('   PRODUCTION BUILD: VITE_API_URL was not set during build!')
    console.error('   Check GitHub Secrets:')
    console.error('   1. Go to: https://github.com/Nerdware-Developers/P-O-S/settings/secrets/actions')
    console.error('   2. Verify VITE_API_URL secret exists and is set correctly')
    console.error('   3. Re-run the GitHub Actions workflow')
  }
}

if (API_KEY === 'YOUR_API_KEY' || !API_KEY) {
  console.error('❌ CRITICAL: API_KEY is using default placeholder!')
  if (import.meta.env.DEV) {
    console.error('   This means Vite did not load VITE_API_KEY from .env file')
  } else {
    console.error('   PRODUCTION BUILD: VITE_API_KEY was not set during build!')
    console.error('   Check GitHub Secrets:')
    console.error('   1. Go to: https://github.com/Nerdware-Developers/P-O-S/settings/secrets/actions')
    console.error('   2. Verify VITE_API_KEY secret exists and is set correctly')
    console.error('   3. Re-run the GitHub Actions workflow')
  }
}

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, id = null, additionalParams = {}) {
  // Google Apps Script web apps may not support PUT/DELETE directly
  // Use POST with _method parameter as fallback
  let actualMethod = method
  if (method === 'PUT' || method === 'DELETE') {
    actualMethod = 'POST'
    additionalParams._method = method
  }
  
  // Build query parameters for Google Apps Script
  const params = new URLSearchParams({
    endpoint: endpoint,
    ...additionalParams
  })
  
  // Validate API configuration before making request
  if (API_BASE_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' || !API_BASE_URL) {
    throw new Error('API URL is not configured. Please create a .env file with VITE_API_URL. See ENV_SETUP.md for instructions.')
  }
  
  // Add API key if it's configured
  if (API_KEY && API_KEY !== 'YOUR_API_KEY') {
    // Double-check that API_KEY is not accidentally set to the URL
    if (API_KEY.startsWith('http')) {
      console.error('❌ CRITICAL: API_KEY is set to a URL! This is incorrect.')
      console.error('   API_KEY value:', API_KEY.substring(0, 50) + '...')
      console.error('   This should be the secret key from GoogleAppsScript/Code.gs line 17')
      console.error('   NOT the API URL (VITE_API_URL)')
      throw new Error('API_KEY is incorrectly configured. It should be the secret key, not the API URL. Check your .env file or GitHub Secrets.')
    }
    params.append('apiKey', API_KEY)
  } else {
    console.error('API_KEY is not configured! Check your .env file.')
    throw new Error('API key is not configured. Please set VITE_API_KEY in your .env file. See ENV_SETUP.md for instructions.')
  }
  
  if (id) {
    params.append('id', id)
  }

  const url = `${API_BASE_URL}?${params.toString()}`
  
  const options = {
    method: actualMethod,
    // Google Apps Script web apps need CORS mode
    mode: 'cors',
    credentials: 'omit'
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    // Try using URL-encoded form data to avoid CORS preflight issues
    // Google Apps Script can handle both JSON and form data
    const formData = new URLSearchParams()
    
    // Add all data fields
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        // Stringify arrays and objects, otherwise convert to string
        if (Array.isArray(data[key]) || (typeof data[key] === 'object' && data[key] !== null)) {
          formData.append(key, JSON.stringify(data[key]))
        } else {
          formData.append(key, String(data[key]))
        }
      }
    })
    
    // Add endpoint and API key to form data
    formData.append('_endpoint', endpoint)
    formData.append('_apiKey', API_KEY)
    
    options.body = formData.toString()
    options.headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    if (import.meta.env.DEV) {
      console.log('Request data being sent (Form Data):', { endpoint, data })
    }
  } else {
    // No headers needed for GET requests
    options.headers = {}
  }

  try {
    if (import.meta.env.DEV) {
      console.log(`🚀 API Call: ${method} ${endpoint}`, { 
        url: url.substring(0, 150), 
        fullUrl: url,
        hasApiKey: !!API_KEY && API_KEY !== 'YOUR_API_KEY',
        hasData: !!data,
        method: actualMethod,
        options: {
          method: options.method,
          mode: options.mode,
          headers: options.headers,
          hasBody: !!options.body
        }
      })
      if (data) {
        console.log('📦 Request body data:', data)
      }
    }
    
    let response
    try {
      response = await fetch(url, options)
    } catch (networkError) {
      // Network error (CORS, connection failed, etc.)
      console.error('❌ Network/Fetch Error:', {
        error: networkError.message,
        errorName: networkError.name,
        url: url.substring(0, 150),
        fullUrl: url,
        endpoint,
        method: actualMethod,
        stack: networkError.stack
      })
      
      // Provide more specific error messages
      let errorMsg = `Network error: ${networkError.message}`
      if (networkError.message.includes('Failed to fetch') || networkError.message.includes('CORS')) {
        errorMsg += '\n\nThis usually means:\n'
        errorMsg += '1. CORS is not enabled - Check Google Apps Script deployment has "Who has access: Anyone"\n'
        errorMsg += '2. The API URL is incorrect or the deployment was deleted\n'
        errorMsg += '3. Network connectivity issue\n\n'
        errorMsg += 'Open test-api-direct.html in your browser to test the API directly.'
      }
      
      throw new Error(errorMsg)
    }
    
    // Get response text first to handle both JSON and text responses
    const responseText = await response.text()
    
    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: responseText || `HTTP error! status: ${response.status}` }
      }
      const errorMsg = errorData.error || `HTTP error! status: ${response.status}`
      console.error('API Response Error:', { 
        status: response.status, 
        error: errorMsg, 
        url: url.substring(0, 150),
        responseText: responseText.substring(0, 200)
      })
      throw new Error(errorMsg)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse JSON response:', responseText)
      throw new Error('Invalid JSON response from server')
    }
    
    if (import.meta.env.DEV) {
      console.log(`API Success: ${method} ${endpoint}`, result)
    }
    return result
  } catch (error) {
    console.error('API Error:', {
      endpoint,
      method,
      error: error.message,
      url: url.substring(0, 100) + '...'
    })
    throw error
  }
}

// Products API
export const productsAPI = {
  getAll: () => apiCall('products', 'GET'),
  getById: (id) => apiCall('products', 'GET', null, id),
  create: (product) => apiCall('products', 'POST', product),
  update: (id, product) => apiCall('products', 'PUT', product, id),
  delete: (id) => apiCall('products', 'DELETE', null, id),
}

// Sales API
export const salesAPI = {
  getAll: (filters = {}) => {
    return apiCall('sales', 'GET', null, null, filters)
  },
  create: (sale) => apiCall('sales', 'POST', sale),
  getById: (id) => apiCall('sales', 'GET', null, id),
}

// Users API
export const usersAPI = {
  login: (email, password) => apiCall('users', 'POST', { email, password }, null, { action: 'login' }),
  getAll: () => apiCall('users', 'GET'),
  create: (user) => apiCall('users', 'POST', user),
}

// Expenses API
export const expensesAPI = {
  getAll: (filters = {}) => apiCall('expenses', 'GET', null, null, filters),
  getById: (id) => apiCall('expenses', 'GET', null, id),
  create: (expense) => apiCall('expenses', 'POST', expense),
  update: (id, expense) => apiCall('expenses', 'PUT', expense, id),
  delete: (id) => apiCall('expenses', 'DELETE', null, id),
}

// Summary API (real-time daily/monthly sales and profit)
export const summaryAPI = {
  get: () => apiCall('summary', 'GET'),
}

export default apiCall

