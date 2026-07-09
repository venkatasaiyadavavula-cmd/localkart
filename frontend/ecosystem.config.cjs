/** PM2 config — always use `next start` so .next/static and public/ are served correctly. */
module.exports = {
  apps: [
    {
      name: 'localkart-frontend',
      cwd: __dirname,
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
        PORT: 3000,
      },
    },
  ],
};
