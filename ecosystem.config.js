module.exports = {
    apps: [
      {
        name: 'solana-wallet-analysis-service-dev',
        script: 'dist/main.js',
        watch: true,
        exec_mode: 'fork', // or 'cluster'
        // instances: 'max', // or a specific number
      },
    ],
  };