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

if (args.length === 0) {
  console.error('Error: Please provide a commit message, for example: gac "feat: xxx"');
  process.exit(1);
}

const message = args.join(' ');
executeGitCommand('git add .');
executeGitCommand(`git commit -m "${message}"`);
