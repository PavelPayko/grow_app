const path = require('path')

module.exports = {
  apps: [
    {
      name: 'grow-api',
      script: path.join(__dirname, 'api', 'app.js'),
      cwd: path.join(__dirname, 'api'),
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
