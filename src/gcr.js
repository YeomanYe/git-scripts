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

// Get arguments
const [, , ...args] = process.argv;

// Check for help argument
if (args.includes('-h') || args.includes('--help')) {
  console.log('Usage: gcr');
  console.log('');
  console.log('Description:');
  console.log('  Clean git repository by removing all untracked files and directories.');
  console.log('  Equivalent to: git clean -fdx');
  console.log('');
  console.log('Examples:');
  console.log('  gcr');
  process.exit(0);
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
