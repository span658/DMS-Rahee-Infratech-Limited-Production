const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Enterprise DMS Node.js Process Daemon...');

function startServerProcess() {
  const child = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    stdio: 'inherit'
  });

  child.on('exit', (code, signal) => {
    console.log(`[Daemon] Backend server process exited (code: ${code}, signal: ${signal}). Auto-restarting...`);
    setTimeout(startServerProcess, 500);
  });

  child.on('error', (err) => {
    console.error('[Daemon Error]:', err);
    setTimeout(startServerProcess, 1000);
  });
}

startServerProcess();
