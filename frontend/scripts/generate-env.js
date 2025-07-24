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
 * Generate environment.ts file content
 */
function generateEnvironmentContent(envVars, isProduction = false) {
  return `export const environment = {
  production: ${isProduction},
  supabase: {
    url: '${envVars.SUPABASE_URL || ''}',
    anonKey: '${envVars.SUPABASE_ANON_KEY || ''}'
  },
  removeBg: {
    apiKey: '${envVars.REMOVE_BG_API_KEY || ''}'
  }
};
`;
}

/**
 * Main function to generate environment files
 */
function generateEnvironmentFiles() {
  // Try to load from frontend/.env first, then from root .env
  const frontendEnvPath = path.join(__dirname, '..', '.env');
  const rootEnvPath = path.join(__dirname, '..', '..', '.env');

  let envVars = loadEnvFile(frontendEnvPath);
  
  // If frontend .env is empty, try root .env
  if (Object.keys(envVars).length === 0) {
    envVars = loadEnvFile(rootEnvPath);
  }

  if (Object.keys(envVars).length === 0) {
    console.warn('No environment variables found in .env files. Using default values.');
    return;
  }

  console.log('Loaded environment variables:', Object.keys(envVars));

  // Generate development environment file
  const devEnvPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
  const devContent = generateEnvironmentContent(envVars, false);
  fs.writeFileSync(devEnvPath, devContent);
  console.log('✅ Generated development environment file');

  // Generate production environment file
  const prodEnvPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
  const prodContent = generateEnvironmentContent(envVars, true);
  fs.writeFileSync(prodEnvPath, prodContent);
  console.log('✅ Generated production environment file');
}

// Run the script
generateEnvironmentFiles(); 