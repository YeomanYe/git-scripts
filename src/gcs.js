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
  .name('gcs')
  .description('Stash local commits step by step, useful for reordering or modifying commits')
  .version('1.0.0')
  .usage('[options]')
  .option('-a, --all', 'Stash all commits except the first one')
  .addHelpText('after', `\nExamples:\n  $ gcs              Stash only the latest commit\n  $ gcs -a           Stash all commits except the first one`)
  .action((options) => {
    let currentBranch;
    try {
      currentBranch = executeGitCommand('git rev-parse --abbrev-ref HEAD').trim();
    } catch (error) {
      console.error('Error: Not currently on a branch');
      process.exit(1);
    }

    const remoteBranch = `origin/${currentBranch}`;

    // Get commits ahead of remote (just get all commits for testing)
    const commits = executeGitCommand(`git log --pretty=format:"%H %s"`).trim();

    if (!commits) {
      console.log(`Info: No local commits ahead of ${remoteBranch}`);
      process.exit(0);
    }

    const commitList = commits.split('\n').reverse();

    if (options.all) {
      console.log('Stashing all commits step by step...');
      for (const commit of commitList.slice(1)) { // Skip first commit
        const [commitHash, ...commitMessageParts] = commit.split(' ');
        const commitMessage = commitMessageParts.join(' ');
        
        executeGitCommand('git reset HEAD~1');
        executeGitCommand(`git stash push -m "${commitMessage}" -u`);
        
        console.log(`Stashed commit: ${commitMessage}`);
      }
    } else {
      if (commitList.length > 1) {
        console.log('Stashing only the latest commit...');
        const latestCommit = commitList[commitList.length - 1];
        const [commitHash, ...commitMessageParts] = latestCommit.split(' ');
        const commitMessage = commitMessageParts.join(' ');
        
        executeGitCommand('git reset HEAD~1');
        executeGitCommand(`git stash push -m "${commitMessage}" -u`);
        
        console.log(`Stashed commit: ${commitMessage}`);
      } else {
        console.log('Info: Only one commit exists, nothing to stash');
        process.exit(0);
      }
    }

    console.log();
    console.log('Stash operation completed successfully!');
    console.log('You can view them with \'git stash list\'');
    console.log('To apply them back, use \'git stash pop\' or \'git stash apply\'');
  });

// Parse arguments
program.parse(process.argv);
