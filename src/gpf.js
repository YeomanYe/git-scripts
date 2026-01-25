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
  console.log('Usage: gpf [commit-message]');
  console.log('');
  console.log('Description:');
  console.log('  Quickly add all changes, commit with the provided message, and force push.');
  console.log('  Equivalent to: git add . && git commit -m "[commit-message]" && git push -f');
  console.log('');
  console.log('Examples:');
  console.log('  gpf "feat: add new feature"');
  console.log('  gpf "fix: resolve bug"');
  process.exit(0);
}

if (args.length === 0) {
  console.error('Error: Please provide a commit message, for example: gpf "feat: xxx"');
  console.error('Use gpf -h or gpf --help for more information.');
  process.exit(1);
}

const message = args.join(' ');
executeGitCommand('git add .');
executeGitCommand(`git commit -m "${message}"`);
executeGitCommand('git push -f');
