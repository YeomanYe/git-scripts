#!/usr/bin/env node

const { execSync } = require('child_process');
const { Command } = require('commander');

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

// Create commander instance
const program = new Command();

// Configure program
program
  .name('gac')
  .description('Quickly add all changes and commit with the provided message')
  .version('1.0.0')
  .usage('[commit-message]')
  .argument('<commit-message>', 'Commit message for the git commit')
  .addHelpText('after', `\nExamples:\n  $ gac "feat: add new feature"\n  $ gac "fix: resolve bug"`)
  .action((message) => {
    executeGitCommand('git add .');
    executeGitCommand(`git commit -m "${message}"`);
  });

// Parse arguments
program.parse(process.argv);
