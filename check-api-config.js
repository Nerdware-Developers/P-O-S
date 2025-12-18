/**
 * Quick script to check if API configuration is set up correctly
 * Run with: node check-api-config.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking API Configuration...\n');

// Check for .env file
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('\n📝 Create a .env file in the project root with:');
  console.error('   VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
  console.error('   VITE_API_KEY=your_api_key_here');
  console.error('\n📖 See ENV_SETUP.md for detailed instructions\n');
  process.exit(1);
}

// Read .env file
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
  process.exit(1);
}

// Parse .env file
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Check for required variables
const requiredVars = ['VITE_API_URL', 'VITE_API_KEY'];
let allGood = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (!value || value.includes('YOUR_') || value.includes('your_')) {
    console.error(`❌ ${varName} is not configured or still has placeholder value`);
    allGood = false;
  } else {
    console.log(`✅ ${varName} is configured`);
    if (varName === 'VITE_API_URL') {
      // Validate URL format
      if (!value.startsWith('https://script.google.com/macros/s/')) {
        console.warn(`⚠️  ${varName} doesn't look like a Google Apps Script URL`);
      } else {
        console.log(`   URL: ${value.substring(0, 60)}...`);
      }
    } else if (varName === 'VITE_API_KEY') {
      console.log(`   Key length: ${value.length} characters`);
    }
  }
});

if (allGood) {
  console.log('\n✅ Configuration looks good!');
  console.log('💡 Remember to restart your dev server (npm run dev) after creating/updating .env\n');
} else {
  console.error('\n❌ Configuration incomplete. Please fix the issues above.\n');
  process.exit(1);
}

