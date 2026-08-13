// pm2 process definition. pm2 keeps the API running across crashes and reboots.
//
// Usage on the server:
//   cd /var/www/crm-api
//   pm2 start deploy/ecosystem.config.js
//   pm2 save                 # persist the process list
//   pm2 startup              # print the systemd command to run for boot persistence
//
// Useful afterwards:
//   pm2 logs crm-api         # tail logs
//   pm2 restart crm-api      # after pulling new code
//   pm2 status

module.exports = {
  apps: [
    {
      name: 'crm-api',
      script: 'server.js',
      cwd: '/var/www/crm-api',

      // A t3.micro has 1 GB RAM and 2 vCPU, but cluster mode would double the
      // memory footprint for no real benefit at this scale. One instance is right.
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Restart if the process leaks past this. On a 1 GB box, leaving headroom
      // for nginx and the OS matters.
      max_memory_restart: '400M',

      // Back off rather than hot-looping if the app crashes on boot — e.g. a bad
      // MONGO_URI, which would otherwise spin at full CPU.
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      error_file: '/var/log/crm/error.log',
      out_file: '/var/log/crm/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
