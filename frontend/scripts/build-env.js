const fs = require('fs');
const path = require('path');

/**
 * Read .env file and parse environment variables
 */
function loadEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) {
      console.warn(`Environment file not found: ${envPath}`);
      return {};
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });

    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error);
    return {};
  }
}

/**
 * Main function to load environment variables
 */
function loadEnvironment() {
  // Try to load from frontend/.env first, then from root .env
  const frontendEnvPath = path.join(__dirname, '..', '.env');
  const rootEnvPath = path.join(__dirname, '..', '..', '.env');

  let envVars = loadEnvFile(frontendEnvPath);
  
  // If frontend .env is empty, try root .env
  if (Object.keys(envVars).length === 0) {
    envVars = loadEnvFile(rootEnvPath);
  }

  console.log('Loaded environment variables:', Object.keys(envVars));
  return envVars;
}

// Export for use in other scripts
module.exports = { loadEnvironment, loadEnvFile };

// If run directly, load and display environment
if (require.main === module) {
  const env = loadEnvironment();
  console.log('Environment variables loaded:', env);
} 