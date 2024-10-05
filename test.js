const { exec, execSync } = require('child_process');

// Function to restart Docker if it's not active
function restartDockerIfDown() {
  try {
    execSync('systemctl is-active --quiet docker');
    console.log('Docker is running fine.');
  } catch (error) {
    console.log('Docker is down, restarting Docker...');
    execSync('systemctl restart docker');

    // Wait for Docker to come back online
    setTimeout(() => {
      try {
        execSync('systemctl is-active --quiet docker');
        console.log('Docker restarted successfully.');
      } catch (error) {
        console.log('Failed to restart Docker. Please check manually.');
        process.exit(1);
      }
    }, 10000);
  }
}

// Function to ensure Windows container is running
function ensureWindowsContainerRunning() {
  const containerName = 'windows';
  exec(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`, (error, stdout) => {
    if (error || !stdout.includes(containerName)) {
      console.log('Windows container is not running, starting it...');
      execSync(`docker start ${containerName}`);
      console.log('Windows container started successfully.');
    } else {
      console.log('Windows container is running fine.');
    }
  });
}

// Function to prevent Docker from force-stopping
function preventForceStop() {
  console.log('Preventing force-stop...');
  
  // Monitor Docker daemon and restart if stopped
  setInterval(() => {
    try {
      execSync('systemctl is-active --quiet docker');
    } catch (error) {
      console.log('Docker daemon has been stopped forcefully, restarting...');
      execSync('systemctl restart docker');
    }
  }, 60000); // Check every 60 seconds
}

// Set the max listeners limit to 20
process.setMaxListeners(20);

// Add signal listeners once at the start
process.on('SIGINT', () => {
  console.log('SIGINT signal received.');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received.');
});

// Main loop: monitor Docker and container status
setInterval(() => {
  restartDockerIfDown();
  ensureWindowsContainerRunning();
  console.log('Monitoring Docker and Windows container status...');

  // Prevent forced stops
  preventForceStop();
}, 30000); // Check every 30 seconds
