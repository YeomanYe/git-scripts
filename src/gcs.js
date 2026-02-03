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

    // Get commits ahead of remote, ordered from newest to oldest (default git log order)
    const commits = executeGitCommand(`git log --pretty=format:"%H %s" ${remoteBranch}..${currentBranch}`).trim();

    if (!commits) {
      console.log(`Info: No local commits ahead of ${remoteBranch}`);
      process.exit(0);
    }

    const commitList = commits.split('\n');

    if (options.all) {
      console.log('Stashing all commits step by step...');
      for (const commit of commitList) {
        const [commitHash, ...commitMessageParts] = commit.split(' ');
        const commitMessage = commitMessageParts.join(' ');
        
        executeGitCommand('git reset HEAD~1');
        executeGitCommand(`git stash push -m "${commitMessage}" -u`);
        
        console.log(`Stashed commit: ${commitMessage}`);
      }
    } else {
      // Only stash the latest commit
      console.log('Stashing only the latest commit...');
      const latestCommit = commitList[0];
      const [commitHash, ...commitMessageParts] = latestCommit.split(' ');
      const commitMessage = commitMessageParts.join(' ');
      
      executeGitCommand('git reset HEAD~1');
      executeGitCommand(`git stash push -m "${commitMessage}" -u`);
      
      console.log(`Stashed commit: ${commitMessage}`);
    }

    console.log();
    console.log('Stash operation completed successfully!');
    console.log('You can view them with \'git stash list\'');
    console.log('To apply them back, use \'git stash pop\' or \'git stash apply\'');
  });

// Parse arguments
program.parse(process.argv);
