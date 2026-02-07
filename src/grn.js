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
  .name('grn')
  .description('Interactive rebase for the last N commits')
  .version('1.0.0')
  .argument('<n>', 'Number of commits to rebase')
  .usage('<n>')
  .addHelpText('after', `\nExamples:\n  $ grn 3  # Rebase last 3 commits interactively\n  $ grn 5  # Rebase last 5 commits interactively`)
  .action((n) => {
    const commits = parseInt(n, 10);
    if (isNaN(commits) || commits <= 0) {
      console.error('Error: N must be a positive integer');
      process.exit(1);
    }

    const targetRef = `HEAD~${commits}`;
    console.log(`Starting interactive rebase for last ${commits} commits...`);
    console.log(`Command: git rebase -i ${targetRef}`);

    try {
      executeGitCommand(`git rebase -i ${targetRef}`);
      console.log('Rebase completed successfully!');
    } catch (error) {
      console.log('Rebase interrupted or failed');
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);
