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

// Encode special characters to markers for stash message
// - Escape existing markers first: ::X:: → ::::X::::
// - Then encode: \n → ::NL::, \r → ::CR::, \t → ::TAB::, " → ::DQ::
function encodeMessage(message) {
  // First escape any existing markers to prevent conflicts
  let encoded = message.replace(/::([A-Z]+)::/g, '::::$1::::');
  // Then encode special characters
  encoded = encoded.replace(/\n/g, '::NL::');
  encoded = encoded.replace(/\r/g, '::CR::');
  encoded = encoded.replace(/\t/g, '::TAB::');
  encoded = encoded.replace(/"/g, '::DQ::');
  return encoded;
}

// Create commander instance
const program = new Command();

// Configure program
program
  .name('gcs')
  .description('Stash local commits step by step, useful for reordering or modifying commits')
  .version('1.0.0')
  .usage('[options]')
  .option('-a, --all', 'Stash all commits ahead of remote')
  .addHelpText('after', `\nExamples:\n  $ gcs              Stash only the latest commit\n  $ gcs -a           Stash all commits ahead of remote`)
  .action((options) => {
    let currentBranch;
    try {
      currentBranch = executeGitCommand('git rev-parse --abbrev-ref HEAD').trim();
    } catch (error) {
      console.error('Error: Not currently on a branch');
      process.exit(1);
    }

    const remoteBranch = `origin/${currentBranch}`;

    // Check if remote branch exists
    try {
      executeGitCommand(`git show-ref --verify --quiet "refs/remotes/${remoteBranch}"`);
    } catch (error) {
      console.error(`Error: Remote branch ${remoteBranch} does not exist`);
      process.exit(1);
    }

    // Get list of commit hashes ahead of remote
    const commitHashes = executeGitCommand(`git log --pretty=format:"%H" ${remoteBranch}..${currentBranch}`).trim().split('\n').filter(h => h);

    if (!commitHashes || commitHashes.length === 0) {
      console.log(`Info: No local commits ahead of ${remoteBranch}`);
      process.exit(0);
    }

    if (options.all) {
      console.log('Stashing all commits step by step...');
      for (const commitHash of commitHashes) {
        // Get full commit message for each commit
        const commitMessage = executeGitCommand(`git log --format=%B -1 ${commitHash}`).trim();
        const encodedMessage = encodeMessage(commitMessage);

        executeGitCommand('git reset HEAD~1');
        executeGitCommand(`git stash push -m "${encodedMessage}" -u`);

        console.log(`Stashed commit: ${commitMessage.split('\n')[0]}`);
      }
    } else {
      // Only stash the latest commit
      console.log('Stashing only the latest commit...');
      const commitHash = commitHashes[0];
      const commitMessage = executeGitCommand(`git log --format=%B -1 ${commitHash}`).trim();
      const encodedMessage = encodeMessage(commitMessage);

      executeGitCommand('git reset HEAD~1');
      executeGitCommand(`git stash push -m "${encodedMessage}" -u`);

      console.log(`Stashed commit: ${commitMessage.split('\n')[0]}`);
    }

    console.log();
    console.log('Stash operation completed successfully!');
    console.log('You can view them with \'git stash list\'');
    console.log('To apply them back, use \'git stash pop\' or \'git stash apply\'');
  });

// Parse arguments
program.parse(process.argv);
