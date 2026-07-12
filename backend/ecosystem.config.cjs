/** PM2 config — cwd must be backend/ so dotenv loads backend/.env on each start. */
module.exports = {
  apps: [
    {
      name: 'localkart-backend',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
