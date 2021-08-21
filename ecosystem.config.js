module.exports = {
  apps : [{
    name: 'classon-web',
    script: 'index.js',
    autorestart: true,
    // instances: 2,
    // exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
