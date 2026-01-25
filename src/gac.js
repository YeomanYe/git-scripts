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

// Get commit message from arguments
const [, , ...args] = process.argv;

// Check for help argument
if (args.includes('-h') || args.includes('--help')) {
  console.log('Usage: gac [commit-message]');
  console.log('');
  console.log('Description:');
  console.log('  Quickly add all changes and commit with the provided message.');
  console.log('  Equivalent to: git add . && git commit -m "[commit-message]"');
  console.log('');
  console.log('Examples:');
  console.log('  gac "feat: add new feature"');
  console.log('  gac "fix: resolve bug"');
  process.exit(0);
}

if (args.length === 0) {
  console.error('Error: Please provide a commit message, for example: gac "feat: xxx"');
  console.error('Use gac -h or gac --help for more information.');
  process.exit(1);
}

const message = args.join(' ');
executeGitCommand('git add .');
executeGitCommand(`git commit -m "${message}"`);
