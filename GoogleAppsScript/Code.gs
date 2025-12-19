/**
 * POS System - Google Apps Script Backend
 * 
 * This script provides a REST API for the POS system using Google Sheets as the database.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Apps Script project
 * 2. Copy this entire code into the Code.gs file
 * 3. Create Google Sheets with the following structure (see SETUP.md for details)
 * 4. Update the SPREADSHEET_ID and SHEET_NAMES below
 * 5. Deploy as a web app with "Execute as: Me" and "Who has access: Anyone"
 * 6. Copy the web app URL and use it as your API_BASE_URL
 */

// ============ CONFIGURATION ============
const SPREADSHEET_ID = '1MydG38l_UK7Qwvi6lwcHyiSY4tUvrU2oGvIwrqdZETM'; // Your Google Sheet ID
const API_KEY = '1d5fa25f7a937aa1d8c42f9f0779654ded5ddff1a446d99691b1ce0bc7fe0db6'; // Your API key

// Sheet names
const SHEET_NAMES = {
  PRODUCTS: 'Products',
  SALES: 'Sales',
  USERS: 'Users',
  EXPENSES: 'Expenses',
  SUMMARY: 'Summary'
};

// ============ HELPER FUNCTIONS ============

function validateConfiguration() {
  if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE' || !SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID is not configured. Please update it in Code.gs with your Google Sheet ID.');
  }
  if (API_KEY === 'YOUR_SECURE_API_KEY_HERE' || !API_KEY) {
    throw new Error('API_KEY is not configured. Please update it in Code.gs with a secure random string.');
  }
}

function getSheet(sheetName) {
  // Validate configuration first
  validateConfiguration();
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Initialize headers if sheet is new
      if (sheetName === SHEET_NAMES.PRODUCTS) {
        sheet.appendRow(['id', 'name', 'price', 'buyingPrice', 'stock', 'unitType', 'category', 'description', 'image', 'size', 'color', 'createdAt', 'updatedAt']);
      } else if (sheetName === SHEET_NAMES.SALES) {
        sheet.appendRow(['id', 'items', 'subtotal', 'total', 'profit', 'userId', 'userName', 'timestamp', 'createdAt']);
      } else if (sheetName === SHEET_NAMES.SUMMARY) {
        sheet.appendRow(['date', 'dailySales', 'dailyProfit', 'monthlySales', 'monthlyProfit', 'lastUpdated']);
      } else if (sheetName === SHEET_NAMES.USERS) {
        sheet.appendRow(['id', 'email', 'password', 'name', 'role', 'createdAt']);
      } else if (sheetName === SHEET_NAMES.EXPENSES) {
        sheet.appendRow(['id', 'description', 'category', 'amount', 'date', 'paymentMethod', 'notes', 'createdAt']);
      }
    }
    return sheet;
  } catch (error) {
    if (error.message.includes('openById')) {
      throw new Error('Cannot access spreadsheet. Please check: 1) SPREADSHEET_ID is correct, 2) The spreadsheet exists, 3) The script has permission to access it. Error: ' + error.message);
    }
    throw error;
  }
}

function getDataRange(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  return range.getValues();
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function rowToObject(row, headers) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index];
  });
  return obj;
}

function objectToRow(obj, headers) {
  return headers.map(header => obj[header] || '');
}

function generateId() {
  return Utilities.getUuid();
}

function formatItemsAsText(items) {
  if (!items || !Array.isArray(items)) {
    return '';
  }
  return items.map(item => {
    const name = item.productName || item.name || 'Unknown';
    const qty = item.quantity || 0;
    return `${name} (qty: ${qty})`;
  }).join(', ');
}

function validateApiKey(request) {
  // Google Apps Script web apps don't reliably support custom headers
  // Use query parameter or body parameter (for POST requests with body)
  
  // Defensive check - ensure request exists
  if (!request) {
    throw new Error('Request object is undefined');
  }
  
  // Try to get API key from multiple sources
  let apiKey = null;
  let source = 'none';
  
  // 1. Check query parameter (for GET requests)
  if (request.parameter && request.parameter.apiKey) {
    apiKey = request.parameter.apiKey;
    source = 'query parameter';
  }
  // 2. Check JSON body (for POST with JSON)
  // 3. Check form data (application/x-www-form-urlencoded)
  else if (request.postData && request.postData.contents) {
    const contentType = request.postData.type || '';
    
    // Try JSON first
    if (contentType.includes('application/json')) {
      try {
        const bodyData = JSON.parse(request.postData.contents);
        apiKey = bodyData._apiKey || bodyData.apiKey;
        if (apiKey) {
          source = 'JSON body';
        }
      } catch (e) {
        // JSON parse failed, continue to form data
      }
    }
    
    // If no API key found yet, try form data
    if (!apiKey && (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('form'))) {
      // Form data is automatically parsed into request.parameter by Google Apps Script
      if (request.parameter && request.parameter._apiKey) {
        apiKey = request.parameter._apiKey;
        source = 'form data (_apiKey)';
      } else if (request.parameter && request.parameter.apiKey) {
        apiKey = request.parameter.apiKey;
        source = 'form data (apiKey)';
      }
    }
    
    // Final fallback to query parameter
    if (!apiKey && request.parameter && request.parameter.apiKey) {
      apiKey = request.parameter.apiKey;
      source = 'query parameter (fallback)';
    }
  }
  // 3. Check form data parameters (fallback)
  else if (request.parameter && request.parameter.apiKey) {
    apiKey = request.parameter.apiKey;
    source = 'parameter (fallback)';
  }
  
  // Debug logging (remove in production if desired)
  console.log('API Key validation:', {
    found: !!apiKey,
    source: source,
    hasParameter: !!request.parameter,
    hasPostData: !!(request.postData && request.postData.contents),
    parameterKeys: request.parameter ? Object.keys(request.parameter) : []
  });
  
  if (!apiKey) {
    // Provide more helpful error message
    let errorMsg = 'API key is required. ';
    if (request.parameter) {
      errorMsg += 'Available parameters: ' + Object.keys(request.parameter).join(', ') + '. ';
    }
    errorMsg += 'Add ?apiKey=YOUR_KEY to the URL or include _apiKey in JSON body.';
    throw new Error(errorMsg);
  }
  if (apiKey !== API_KEY) {
    throw new Error('Invalid API key. Received: ' + apiKey.substring(0, 10) + '...');
  }
}

// ============ PRODUCTS API ============

function getProducts() {
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const products = data.map(row => {
    const product = rowToObject(row, headers);
    // Convert numeric fields
    product.price = parseFloat(product.price) || 0;
    product.buyingPrice = parseFloat(product.buyingPrice) || 0;
    product.stock = parseInt(product.stock) || 0;
    return product;
  });
  
  return { success: true, products };
}

function getProductById(id) {
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const product = data.find(row => {
    const obj = rowToObject(row, headers);
    return obj.id === id;
  });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const productObj = rowToObject(product, headers);
  productObj.price = parseFloat(productObj.price) || 0;
  productObj.buyingPrice = parseFloat(productObj.buyingPrice) || 0;
  productObj.stock = parseInt(productObj.stock) || 0;
  
  return { success: true, product: productObj };
}

function createProduct(productData) {
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const headers = getHeaders(sheet);
  
  const newProduct = {
    id: generateId(),
    name: productData.name || '',
    price: productData.price || 0,
    buyingPrice: productData.buyingPrice || 0,
    stock: productData.stock || 0,
    unitType: productData.unitType || 'pcs',
    category: productData.category || '',
    description: productData.description || '',
    image: productData.image || '',
    size: productData.size || '',
    color: productData.color || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const row = objectToRow(newProduct, headers);
  sheet.appendRow(row);
  
  return { success: true, product: newProduct };
}

function updateProduct(id, productData) {
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const rowIndex = data.findIndex(row => {
    const obj = rowToObject(row, headers);
    return obj.id === id;
  });
  
  if (rowIndex === -1) {
    throw new Error('Product not found');
  }
  
  const existingProduct = rowToObject(data[rowIndex], headers);
  const updatedProduct = {
    ...existingProduct,
    ...productData,
    id: existingProduct.id, // Preserve ID
    updatedAt: new Date().toISOString()
  };
  
  const row = objectToRow(updatedProduct, headers);
  sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([row]);
  
  return { success: true, product: updatedProduct };
}

function deleteProduct(id) {
  const sheet = getSheet(SHEET_NAMES.PRODUCTS);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const rowIndex = data.findIndex(row => {
    const obj = rowToObject(row, headers);
    return obj.id === id;
  });
  
  if (rowIndex === -1) {
    throw new Error('Product not found');
  }
  
  sheet.deleteRow(rowIndex + 2);
  
  return { success: true, message: 'Product deleted' };
}

// ============ SALES API ============

function getSales(filters) {
  const sheet = getSheet(SHEET_NAMES.SALES);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  // Ensure profit column exists in headers
  if (!headers.includes('profit')) {
    console.log('Profit column missing, adding it...');
    headers.push('profit');
    sheet.getRange(1, headers.length).setValue('profit');
  }
  
  // Ensure userId and userName columns exist
  if (!headers.includes('userId')) {
    headers.push('userId');
    sheet.getRange(1, headers.length).setValue('userId');
  }
  if (!headers.includes('userName')) {
    headers.push('userName');
    sheet.getRange(1, headers.length).setValue('userName');
  }
  
  let sales = data.map(row => {
    const sale = rowToObject(row, headers);
    // Items are stored as JSON string - try to parse it
    if (typeof sale.items === 'string') {
      // Check if it's JSON (starts with [ or {)
      const trimmed = sale.items.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          sale.items = JSON.parse(sale.items);
        } catch (e) {
          console.error('Failed to parse items JSON:', e, sale.items);
          // If it's old formatted text like "Product (qty: 2)", convert to array format
          // or if it's "[object Object]", set to empty array
          if (sale.items.includes('[object Object]')) {
            sale.items = [];
          } else {
            // Try to extract info from formatted text (fallback)
            sale.items = [];
          }
        }
      } else if (sale.items.includes('[object Object]')) {
        // Handle old data with "[object Object]"
        sale.items = [];
      }
      // If it's not JSON and not "[object Object]", keep as string (formatted text)
    } else if (!Array.isArray(sale.items)) {
      // If items is not a string and not an array, set to empty array
      sale.items = [];
    }
    sale.subtotal = parseFloat(sale.subtotal) || 0;
    // If total is 0 or missing (old data), use subtotal (since we removed tax)
    sale.total = parseFloat(sale.total) || sale.subtotal;
    // Parse profit - if missing, try to calculate from items if available
    sale.profit = parseFloat(sale.profit) || 0;
    
    // If profit is 0 but we have items with profit data, calculate it
    if (sale.profit === 0 && Array.isArray(sale.items) && sale.items.length > 0) {
      const calculatedProfit = sale.items.reduce((sum, item) => {
        return sum + (parseFloat(item.profit || 0));
      }, 0);
      if (calculatedProfit > 0) {
        sale.profit = calculatedProfit;
        console.log('Calculated profit from items:', calculatedProfit, 'for sale:', sale.id);
      }
    }
    
    return sale;
  });
  
  // Apply filters
  if (filters.date) {
    sales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
      return saleDate === filters.date;
    });
  }
  
  if (filters.month && filters.year) {
    sales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate.getMonth() + 1 === parseInt(filters.month) && 
             saleDate.getFullYear() === parseInt(filters.year);
    });
  }
  
  // Filter by userId if provided
  if (filters.userId) {
    sales = sales.filter(sale => sale.userId === filters.userId);
  }
  
  return { success: true, sales };
}

function createSale(saleData) {
  const sheet = getSheet(SHEET_NAMES.SALES);
  const headers = getHeaders(sheet);
  
  // Ensure userId and userName columns exist
  if (!headers.includes('userId')) {
    headers.push('userId');
    sheet.getRange(1, headers.length).setValue('userId');
  }
  if (!headers.includes('userName')) {
    headers.push('userName');
    sheet.getRange(1, headers.length).setValue('userName');
  }
  
  // Parse items if it's a string (from form data)
  let items = saleData.items || [];
  console.log('createSale - items type:', typeof items, 'items value:', items);
  
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
      console.log('Parsed items from JSON string:', items);
    } catch (e) {
      console.error('Failed to parse items JSON:', e, items);
      items = [];
    }
  }
  
  // Ensure items is an array
  if (!Array.isArray(items)) {
    console.error('Items is not an array:', items, 'type:', typeof items);
    items = [];
  }
  
  // Store items as JSON string so we can parse it back for API responses
  // This allows us to reconstruct the array when reading back
  const itemsJsonString = JSON.stringify(items);
  console.log('Storing items as JSON string:', itemsJsonString);
  
  // Calculate totals without tax
  const subtotal = parseFloat(saleData.subtotal) || 0;
  const total = subtotal; // No tax, so total = subtotal
  const profit = parseFloat(saleData.profit) || 0;
  
  const newSale = {
    id: generateId(),
    items: itemsJsonString, // Store as JSON string (can be parsed back to array)
    subtotal: subtotal,
    total: total,
    profit: profit,
    userId: saleData.userId || '',
    userName: saleData.userName || '',
    timestamp: saleData.timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  const row = objectToRow(newSale, headers);
  sheet.appendRow(row);
  
  // Update daily and monthly summary in real-time
  updateSalesSummary(newSale);
  
  // Return items as array for API response
  newSale.items = items;
  
  return { success: true, sale: newSale };
}

// ============ SALES SUMMARY FUNCTIONS ============

function updateSalesSummary(sale) {
  try {
    console.log('updateSalesSummary called with sale:', sale);
    const summarySheet = getSheet(SHEET_NAMES.SUMMARY);
    const headers = getHeaders(summarySheet);
    const data = getDataRange(summarySheet);
    
    const saleDate = new Date(sale.timestamp);
    const saleDateOnly = new Date(saleDate);
    saleDateOnly.setHours(0, 0, 0, 0);
    const saleDateStr = saleDateOnly.toISOString().split('T')[0];
    const saleMonth = saleDate.getMonth() + 1;
    const saleYear = saleDate.getFullYear();
    
    console.log('Sale date info:', { saleDateStr, saleMonth, saleYear, saleTotal: sale.total, saleProfit: sale.profit });
    
    // Recalculate monthly totals from all sales in the month FIRST
    const salesSheet = getSheet(SHEET_NAMES.SALES);
    const salesHeaders = getHeaders(salesSheet);
    const allSales = getDataRange(salesSheet);
    
    let monthlySales = 0;
    let monthlyProfit = 0;
    
    allSales.forEach(saleRow => {
      const saleObj = rowToObject(saleRow, salesHeaders);
      if (saleObj.timestamp) {
        const saleTimestamp = new Date(saleObj.timestamp);
        if (saleTimestamp.getMonth() + 1 === saleMonth && saleTimestamp.getFullYear() === saleYear) {
          // Handle total - use subtotal if total is 0 (for old data)
          const saleTotal = parseFloat(saleObj.total) || parseFloat(saleObj.subtotal) || 0;
          monthlySales += saleTotal;
          monthlyProfit += parseFloat(saleObj.profit || 0);
        }
      }
    });
    
    console.log('Calculated monthly totals:', { monthlySales, monthlyProfit });
    
    // Find or create today's row
    let todayRowIndex = data.findIndex(row => {
      const obj = rowToObject(row, headers);
      return obj.date === saleDateStr;
    });
    
    if (todayRowIndex === -1) {
      // Create new row for today
      const newRow = {
        date: saleDateStr,
        dailySales: sale.total,
        dailyProfit: sale.profit,
        monthlySales: monthlySales,
        monthlyProfit: monthlyProfit,
        lastUpdated: new Date().toISOString()
      };
      const row = objectToRow(newRow, headers);
      summarySheet.appendRow(row);
      console.log('Created new summary row for today');
    } else {
      // Update existing row
      const existingRow = rowToObject(data[todayRowIndex], headers);
      const updatedRow = {
        date: existingRow.date,
        dailySales: parseFloat(existingRow.dailySales || 0) + parseFloat(sale.total),
        dailyProfit: parseFloat(existingRow.dailyProfit || 0) + parseFloat(sale.profit),
        monthlySales: monthlySales,
        monthlyProfit: monthlyProfit,
        lastUpdated: new Date().toISOString()
      };
      const row = objectToRow(updatedRow, headers);
      summarySheet.getRange(todayRowIndex + 2, 1, 1, headers.length).setValues([row]);
      console.log('Updated existing summary row');
    }
    
    // Refresh data and update all rows for the same month with recalculated totals
    const refreshedData = getDataRange(summarySheet);
    refreshedData.forEach((row, index) => {
      const obj = rowToObject(row, headers);
      if (obj.date) {
        const rowDate = new Date(obj.date);
        if (rowDate.getMonth() + 1 === saleMonth && rowDate.getFullYear() === saleYear) {
          const updatedRow = {
            date: obj.date,
            dailySales: parseFloat(obj.dailySales || 0),
            dailyProfit: parseFloat(obj.dailyProfit || 0),
            monthlySales: monthlySales,
            monthlyProfit: monthlyProfit,
            lastUpdated: new Date().toISOString()
          };
          const rowData = objectToRow(updatedRow, headers);
          summarySheet.getRange(index + 2, 1, 1, headers.length).setValues([rowData]);
        }
      }
    });
    
    console.log('Summary update completed successfully');
  } catch (error) {
    console.error('Error updating sales summary:', error);
    console.error('Error stack:', error.stack);
    // Don't throw - summary update failure shouldn't break the sale
  }
}

function getSalesSummary() {
  try {
    const summarySheet = getSheet(SHEET_NAMES.SUMMARY);
    const headers = getHeaders(summarySheet);
    const data = getDataRange(summarySheet);
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log('getSalesSummary - Looking for date:', today, 'Month:', currentMonth, 'Year:', currentYear);
    console.log('Summary sheet data rows:', data.length);
    
    // Find today's summary
    const todayRow = data.find(row => {
      const obj = rowToObject(row, headers);
      const rowDate = obj.date ? new Date(obj.date).toISOString().split('T')[0] : null;
      return rowDate === today;
    });
    
    // Find current month's summary (use today's row if it exists)
    const monthlyRow = todayRow || data.find(row => {
      const obj = rowToObject(row, headers);
      if (!obj.date) return false;
      const rowDate = new Date(obj.date);
      return rowDate.getMonth() + 1 === currentMonth && rowDate.getFullYear() === currentYear;
    });
    
    const todayObj = todayRow ? rowToObject(todayRow, headers) : null;
    const monthlyObj = monthlyRow ? rowToObject(monthlyRow, headers) : null;
    
    let dailySales = todayObj ? parseFloat(todayObj.dailySales || 0) : 0;
    let dailyProfit = todayObj ? parseFloat(todayObj.dailyProfit || 0) : 0;
    let monthlySales = monthlyObj ? parseFloat(monthlyObj.monthlySales || 0) : 0;
    let monthlyProfit = monthlyObj ? parseFloat(monthlyObj.monthlyProfit || 0) : 0;
    
    // Always recalculate from sales data to ensure accuracy (summary sheet might be out of sync)
    // This ensures profit is always calculated correctly even if summary sheet has issues
    console.log('Recalculating from sales data to ensure accuracy...');
    const salesSheet = getSheet(SHEET_NAMES.SALES);
    const salesHeaders = getHeaders(salesSheet);
    const allSales = getDataRange(salesSheet);
    
    // Ensure profit column exists
    if (!salesHeaders.includes('profit')) {
      console.log('Profit column missing in sales sheet, adding it...');
      salesHeaders.push('profit');
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const salesSheetObj = ss.getSheetByName(SHEET_NAMES.SALES);
      salesSheetObj.getRange(1, salesHeaders.length).setValue('profit');
    }
    
    // Reset and calculate daily totals from actual sales
    let calculatedDailySales = 0;
    let calculatedDailyProfit = 0;
    allSales.forEach((saleRow, index) => {
      const saleObj = rowToObject(saleRow, salesHeaders);
      if (saleObj.timestamp) {
        const saleDate = new Date(saleObj.timestamp).toISOString().split('T')[0];
        if (saleDate === today) {
          const saleTotal = parseFloat(saleObj.total) || parseFloat(saleObj.subtotal) || 0;
          let saleProfit = parseFloat(saleObj.profit || 0);
          
          // If profit is 0, try to calculate from items
          if (saleProfit === 0 && saleObj.items) {
            try {
              let items = saleObj.items;
              if (typeof items === 'string') {
                items = JSON.parse(items);
              }
              if (Array.isArray(items)) {
                saleProfit = items.reduce((sum, item) => {
                  return sum + (parseFloat(item.profit || 0));
                }, 0);
                console.log('Calculated profit from items for daily sale:', saleProfit);
              }
            } catch (e) {
              console.error('Error calculating profit from items:', e);
            }
          }
          
          calculatedDailySales += saleTotal;
          calculatedDailyProfit += saleProfit;
          console.log('Daily sale found:', { 
            rowIndex: index + 2,
            date: saleDate, 
            total: saleTotal, 
            profit: saleProfit, 
            profitRaw: saleObj.profit,
            hasItems: !!saleObj.items,
            allFields: Object.keys(saleObj)
          });
        }
      }
    });
    
    // Reset and calculate monthly totals from actual sales
    let calculatedMonthlySales = 0;
    let calculatedMonthlyProfit = 0;
    allSales.forEach(saleRow => {
      const saleObj = rowToObject(saleRow, salesHeaders);
      if (saleObj.timestamp) {
        const saleDate = new Date(saleObj.timestamp);
        if (saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear) {
          const saleTotal = parseFloat(saleObj.total) || parseFloat(saleObj.subtotal) || 0;
          let saleProfit = parseFloat(saleObj.profit || 0);
          
          // If profit is 0, try to calculate from items
          if (saleProfit === 0 && saleObj.items) {
            try {
              let items = saleObj.items;
              if (typeof items === 'string') {
                items = JSON.parse(items);
              }
              if (Array.isArray(items)) {
                saleProfit = items.reduce((sum, item) => {
                  return sum + (parseFloat(item.profit || 0));
                }, 0);
              }
            } catch (e) {
              // Ignore errors
            }
          }
          
          calculatedMonthlySales += saleTotal;
          calculatedMonthlyProfit += saleProfit;
        }
      }
    });
    
    // Use calculated values (they're always accurate from source data)
    dailySales = calculatedDailySales;
    dailyProfit = calculatedDailyProfit;
    monthlySales = calculatedMonthlySales;
    monthlyProfit = calculatedMonthlyProfit;
    
    console.log('Final calculated values:', { dailySales, dailyProfit, monthlySales, monthlyProfit });
    
    return {
      dailySales,
      dailyProfit,
      monthlySales,
      monthlyProfit
    };
  } catch (error) {
    console.error('Error in getSalesSummary:', error);
    // Return zeros if there's an error
    return {
      dailySales: 0,
      dailyProfit: 0,
      monthlySales: 0,
      monthlyProfit: 0
    };
  }
}

// ============ EXPENSES API ============

function getExpenses(filters) {
  const sheet = getSheet(SHEET_NAMES.EXPENSES);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  let expenses = data.map(row => {
    const expense = rowToObject(row, headers);
    expense.amount = parseFloat(expense.amount) || 0;
    return expense;
  });
  
  // Apply filters
  if (filters.date) {
    expenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0];
      return expenseDate === filters.date;
    });
  }
  
  if (filters.month && filters.year) {
    expenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() + 1 === parseInt(filters.month) && 
             expenseDate.getFullYear() === parseInt(filters.year);
    });
  }
  
  if (filters.category) {
    expenses = expenses.filter(expense => expense.category === filters.category);
  }
  
  return { success: true, expenses };
}

function getExpenseById(id) {
  const sheet = getSheet(SHEET_NAMES.EXPENSES);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const expense = data.find(row => {
    const obj = rowToObject(row, headers);
    return obj.id === id;
  });
  
  if (!expense) {
    throw new Error('Expense not found');
  }
  
  const expenseObj = rowToObject(expense, headers);
  expenseObj.amount = parseFloat(expenseObj.amount) || 0;
  
  return { success: true, expense: expenseObj };
}

function createExpense(expenseData) {
  try {
    console.log('createExpense called with:', expenseData);
    const sheet = getSheet(SHEET_NAMES.EXPENSES);
    const headers = getHeaders(sheet);
    console.log('Expenses sheet headers:', headers);
    
    // Parse amount as number (form data sends strings)
    const amount = parseFloat(expenseData.amount) || 0;
    
    const newExpense = {
      id: generateId(),
      description: expenseData.description || '',
      category: expenseData.category || '',
      amount: amount,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      paymentMethod: expenseData.paymentMethod || 'Cash',
      notes: expenseData.notes || '',
      createdAt: new Date().toISOString()
    };
    
    console.log('New expense object:', newExpense);
    const row = objectToRow(newExpense, headers);
    console.log('Row to append:', row);
    sheet.appendRow(row);
    
    return { success: true, expense: newExpense };
  } catch (error) {
    console.error('Error in createExpense:', error);
    throw new Error('Failed to create expense: ' + error.toString());
  }
}

function updateExpense(id, expenseData) {
  const sheet = getSheet(SHEET_NAMES.EXPENSES);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const rowIndex = data.findIndex(row => {
    const obj = rowToObject(row, headers);
    return obj.id === id;
  });
  
  if (rowIndex === -1) {
    throw new Error('Expense not found');
  }
  
  const existingExpense = rowToObject(data[rowIndex], headers);
  const updatedExpense = {
    ...existingExpense,
    ...expenseData,
    id: existingExpense.id, // Preserve ID
  };
  
  const row = objectToRow(updatedExpense, headers);
  sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([row]);
  
  return { success: true, expense: updatedExpense };
}

function deleteExpense(id) {
  const sheet = getSheet(SHEET_NAMES.EXPENSES);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const rowIndex = data.findIndex(row => {
    const obj = rowToObject(row, headers);
    return obj.id === id;
  });
  
  if (rowIndex === -1) {
    throw new Error('Expense not found');
  }
  
  sheet.deleteRow(rowIndex + 2);
  
  return { success: true, message: 'Expense deleted' };
}

// ============ USERS API ============

function loginUser(email, password) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const headers = getHeaders(sheet);
  const data = getDataRange(sheet);
  
  const user = data.find(row => {
    const obj = rowToObject(row, headers);
    return obj.email === email && obj.password === password;
  });
  
  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  const userObj = rowToObject(user, headers);
  delete userObj.password; // Don't send password back
  
  return { success: true, user: userObj };
}

function createUser(userData) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const headers = getHeaders(sheet);
  
  const newUser = {
    id: generateId(),
    email: userData.email || '',
    password: userData.password || '',
    name: userData.name || '',
    role: userData.role || 'user',
    createdAt: new Date().toISOString()
  };
  
  const row = objectToRow(newUser, headers);
  sheet.appendRow(row);
  
  delete newUser.password; // Don't send password back
  
  return { success: true, user: newUser };
}

// ============ MAIN DOGET FUNCTION ============

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  // Support method override for PUT/DELETE via POST
  const method = e.parameter._method || 'POST';
  return handleRequest(e, method);
}

function doPut(e) {
  return handleRequest(e, 'PUT');
}

function doDelete(e) {
  return handleRequest(e, 'DELETE');
}

function doOptions(e) {
  // Handle CORS preflight requests
  // Return empty response with proper headers
  // Note: Google Apps Script automatically adds CORS headers when "Who has access: Anyone" is set
  // But we need to return a valid response for the preflight check
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(e, method = 'GET') {
  try {
    // Skip API key validation for OPTIONS requests (CORS preflight)
    // OPTIONS requests don't include the API key and that's expected
    if (method !== 'OPTIONS') {
      // Validate API key first (it checks JSON body if needed)
      validateApiKey(e);
    }
    
    // Support method override via parameter (for web app limitations)
    if (e.parameter && e.parameter._method) {
      method = e.parameter._method.toUpperCase();
    }
    
    // Get endpoint from pathInfo or parameter first
    const pathInfo = e.pathInfo || '';
    // Check for endpoint in multiple places (endpoint, _endpoint, or pathInfo)
    let endpoint = (e.parameter && (e.parameter.endpoint || e.parameter._endpoint)) || pathInfo.split('/')[0] || '';
    let id = (e.parameter && e.parameter.id) || (pathInfo.split('/').length > 1 ? pathInfo.split('/')[1] : '');
    
    // Debug logging
    console.log('Initial endpoint extraction:', {
      endpoint: endpoint,
      pathInfo: pathInfo,
      hasParameter: !!e.parameter,
      parameterKeys: e.parameter ? Object.keys(e.parameter) : [],
      endpointFromParam: e.parameter ? e.parameter.endpoint : null,
      _endpointFromParam: e.parameter ? e.parameter._endpoint : null
    });
    
    // Parse request body for POST/PUT and extract endpoint
    let requestData = {};
    if (method === 'POST' || method === 'PUT') {
      try {
        const contentType = e.postData ? (e.postData.type || '') : '';
        
        // Check if it's JSON body
        if (e.postData && e.postData.contents && contentType.includes('application/json')) {
          try {
            requestData = JSON.parse(e.postData.contents);
            // Extract endpoint from body if present (overrides query param)
            if (requestData._endpoint) {
              endpoint = requestData._endpoint;
              delete requestData._endpoint;
            }
            // Extract method override from body if present
            if (requestData._method) {
              method = requestData._method.toUpperCase();
              delete requestData._method;
            }
            // API key is already validated, just remove it
            if (requestData._apiKey) {
              delete requestData._apiKey;
            }
            if (requestData.apiKey) {
              delete requestData.apiKey;
            }
          } catch (parseErr) {
            console.log('JSON parse error, trying form data:', parseErr);
            // If JSON parse fails, try form data
            requestData = e.parameter || {};
          }
        } 
        // Handle form data (application/x-www-form-urlencoded)
        else if (e.postData && e.postData.contents && contentType.includes('application/x-www-form-urlencoded')) {
          // Form data is automatically parsed into e.parameter by Google Apps Script
          requestData = e.parameter || {};
          // Extract endpoint from form data if present (overrides query param)
          if (requestData._endpoint) {
            endpoint = requestData._endpoint;
            console.log('Endpoint extracted from form data _endpoint:', endpoint);
          }
          console.log('Form data parsed, endpoint is now:', endpoint, 'requestData keys:', Object.keys(requestData));
        }
        // No postData or unknown content type, use parameters
        else {
          requestData = e.parameter || {};
        }
        
        // Remove API-related params from requestData
        delete requestData.endpoint;
        delete requestData.apiKey;
        delete requestData._apiKey;
        delete requestData._endpoint;
        delete requestData._method;
        
      } catch (err) {
        console.log('Error parsing request data:', err);
        // Fallback to parameters if anything fails
        requestData = e.parameter || {};
        delete requestData.endpoint;
        delete requestData.apiKey;
        delete requestData._apiKey;
        delete requestData._endpoint;
        delete requestData._method;
      }
    }
    
    let result;
    
    // Final endpoint check and logging
    console.log('Routing request:', {
      method: method,
      endpoint: endpoint,
      id: id,
      hasRequestData: !!requestData && Object.keys(requestData).length > 0
    });
    
    // Route handling using endpoint parameter
    if (endpoint === 'products') {
      if (method === 'GET') {
        if (id) {
          result = getProductById(id);
        } else {
          result = getProducts();
        }
      } else if (method === 'POST') {
        // Log for debugging
        console.log('Creating product with data:', requestData);
        if (!requestData || Object.keys(requestData).length === 0) {
          throw new Error('No product data received. Check that the request body is being sent correctly.');
        }
        result = createProduct(requestData);
      } else if (method === 'PUT' && id) {
        result = updateProduct(id, requestData);
      } else if (method === 'DELETE' && id) {
        result = deleteProduct(id);
      } else {
        result = { success: false, error: 'Invalid request' };
      }
    } else if (endpoint === 'sales') {
      if (method === 'GET') {
        if (id) {
          result = { success: false, error: 'Not implemented' };
        } else {
          result = getSales(e.parameter);
        }
      } else if (method === 'POST') {
        result = createSale(requestData);
      } else {
        result = { success: false, error: 'Invalid request' };
      }
    } else if (endpoint === 'expenses') {
      console.log('Expenses endpoint matched, method:', method);
      if (method === 'GET') {
        if (id) {
          result = getExpenseById(id);
        } else {
          result = getExpenses(e.parameter);
        }
      } else if (method === 'POST') {
        // Log for debugging
        console.log('Creating expense with data:', requestData);
        if (!requestData || Object.keys(requestData).length === 0) {
          throw new Error('No expense data received. Check that the request body is being sent correctly.');
        }
        result = createExpense(requestData);
      } else if (method === 'PUT' && id) {
        console.log('Updating expense', id, 'with data:', requestData);
        result = updateExpense(id, requestData);
      } else if (method === 'DELETE' && id) {
        result = deleteExpense(id);
      } else {
        result = { success: false, error: 'Invalid request method for expenses: ' + method };
      }
    } else if (endpoint === 'users') {
      const action = e.parameter.action || '';
      if (action === 'login' && method === 'POST') {
        result = loginUser(requestData.email, requestData.password);
      } else if (method === 'GET') {
        result = { success: false, error: 'Not implemented' };
      } else if (method === 'POST') {
        result = createUser(requestData);
      } else {
        result = { success: false, error: 'Invalid request' };
      }
    } else if (endpoint === 'summary') {
      if (method === 'GET') {
        result = { success: true, ...getSalesSummary() };
      } else {
        result = { success: false, error: 'Invalid request method for summary' };
      }
    } else {
      result = { success: false, error: 'Invalid endpoint. Use ?endpoint=products|sales|users|expenses|summary' };
    }
    
    // Google Apps Script automatically handles CORS when "Who has access: Anyone" is set
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

