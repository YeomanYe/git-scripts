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
    // `git stash -u` only creates a new stash entry when there are local
    // changes. If the working tree is clean it prints "No local changes to
    // save" and creates nothing — dropping stash@{0} afterwards would then
    // delete the user's pre-existing top stash. Only drop when this run
    // actually created a new stash.
    const stashOutput = executeGitCommand('git stash -u');
    const createdStash = !/No local changes to save/.test(stashOutput);
    if (createdStash) {
      executeGitCommand('git stash drop stash@{0}');
    }
    console.log('Git repository cleaned!');
  });

// Parse arguments
program.parse(process.argv);
