#!/usr/bin/env node

const { execSync } = require('child_process');

// Helper function to execute git commands
function executeGitCommand(command) {
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(`Error details: ${error.message}`);
    process.exit(1);
  }
}

// Clean git repository
try {
  // Directly try to clean untracked files
  executeGitCommand('git clean -fdx');
  console.log('Git repository cleaned!');
} catch (error) {
  console.error(`Error cleaning repository: ${error.message}`);
  process.exit(1);
}
