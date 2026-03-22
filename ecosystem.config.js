module.exports = {
  apps: [
    {
      name: 'rentaman-backend',
      cwd: '/var/www/rentaman/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/rentaman-backend-error.log',
      out_file: '/var/log/pm2/rentaman-backend-out.log',
    },
    {
      name: 'rentaman-frontend',
      cwd: '/var/www/rentaman/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/rentaman-frontend-error.log',
      out_file: '/var/log/pm2/rentaman-frontend-out.log',
    },
  ],
};
