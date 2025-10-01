module.exports = {
  apps: [
    {
      name: "health-buddy-app",
      script: "npx",
      args: "--yes tsx server/server.ts",
      instances: "1",
      exec_mode: "fork",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 8000
      }
    }
  ]
};
