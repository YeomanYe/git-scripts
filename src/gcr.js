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
  .name('gcr')
  .description('Clean git repository by removing all untracked files and directories')
  .version('1.0.0')
  .usage('')
  .addHelpText('after', `\nExamples:\n  $ gcr`)
  .action(() => {
    executeGitCommand('git clean -fdx');
    console.log('Git repository cleaned!');
  });

// Parse arguments
program.parse(process.argv);
