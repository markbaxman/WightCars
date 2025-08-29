// PM2 Configuration for WightCars Development Server
module.exports = {
  apps: [
    {
      name: 'wightcars',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        JWT_SECRET: 'wightcars-development-secret-key-2024'
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      
      // Restart policy
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
      
      // Environment-specific settings
      env_development: {
        NODE_ENV: 'development',
        JWT_SECRET: 'wightcars-development-secret-key-2024'
      },
      
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}