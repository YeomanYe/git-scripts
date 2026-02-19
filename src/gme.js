#!/usr/bin/env node

const { execSync } = require('child_process');
const { Command } = require('commander');

// Helper function to execute git commands
function executeGitCommand(command, options = {}) {
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
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
  .name('gme')
  .description('Execute git merge with the provided commit/branch (equivalent to git merge)')
  .version('1.0.0')
  .usage('[options] <commit|branch>')
  .option('-e, --edit', 'Edit the merge commit message')
  .option('--no-ff', 'Create a merge commit even when merging a fast-forward')
  .argument('<commit>', 'Commit or branch to merge')
  .addHelpText('after', `\nExamples:\n  $ gme feature-branch\n  $ gme abc1234\n  $ gme --no-ff feature-branch`)
  .action((commit, options) => {
    let command = `git merge ${commit}`;
    if (options.noFf) {
      command += ' --no-ff';
    }
    if (options.edit) {
      command += ' --edit';
    }
    executeGitCommand(command);
    console.log(`Successfully merged ${commit}`);
  });

// Parse arguments
program.parse(process.argv);
