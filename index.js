#!/usr/bin/env node

import { program } from 'commander';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

program
  .name('git-scripts')
  .description('A collection of git utility scripts')
  .version(packageJson.version);

// Helper function to execute git commands
function executeGitCommand(command) {
  try {
    const output = execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
}

// gac - git add . && git commit -m "xxx"
program
  .command('gac <message>')
  .description('Execute git add . && git commit -m "message"')
  .action((message) => {
    executeGitCommand('git add .');
    executeGitCommand(`git commit -m "${message}"`);
  });

// gcr - git clean repository
program
  .command('gcr')
  .description('Clean git repository by stashing and dropping')
  .action(() => {
    executeGitCommand('git stash -u');
    executeGitCommand('git stash drop stash@{0}');
    console.log('Git repository cleaned!');
  });

// gcs - git commit stash
program
  .command('gcs')
  .description('Stash local commits ahead of remote')
  .option('-a, --all', 'Store all commits step by step')
  .action((options) => {
    const currentBranch = executeGitCommand('git rev-parse --abbrev-ref HEAD').trim();
    const remoteBranch = `origin/${currentBranch}`;
    
    // Check if remote branch exists
    try {
      executeGitCommand(`git show-ref --verify --quiet refs/remotes/${remoteBranch}`);
    } catch (error) {
      console.error(`Error: Remote branch ${remoteBranch} does not exist`);
      process.exit(1);
    }
    
    // Get commits ahead of remote
    const commits = executeGitCommand(`git log --pretty=format:"%H %s" ${remoteBranch}..${currentBranch}`).trim();
    
    if (!commits) {
      console.log(`Info: No local commits ahead of ${remoteBranch}`);
      process.exit(0);
    }
    
    const commitList = commits.split('\n').reverse();
    
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
      console.log('Stashing only the latest commit...');
      const latestCommit = commitList[commitList.length - 1];
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

// gpf - git add . && git commit -m "xxx" && git push -f
program
  .command('gpf <message>')
  .description('Execute git add . && git commit -m "message" && git push -f')
  .action((message) => {
    executeGitCommand('git add .');
    executeGitCommand(`git commit -m "${message}"`);
    executeGitCommand('git push -f');
  });

// gph - git add . && git commit -m "xxx" && git push
program
  .command('gph <message>')
  .description('Execute git add . && git commit -m "message" && git push')
  .action((message) => {
    executeGitCommand('git add .');
    executeGitCommand(`git commit -m "${message}"`);
    executeGitCommand('git push');
  });

// grh - rebase to first commit
program
  .command('grh')
  .description('Rebase current branch onto its first commit')
  .action(() => {
    let currentBranch;
    try {
      currentBranch = executeGitCommand('git symbolic-ref --short HEAD').trim();
    } catch (error) {
      console.error('Error: Not currently on a branch');
      process.exit(1);
    }
    
    const firstCommit = executeGitCommand(`git log --reverse --pretty=format:"%H" ${currentBranch} | head -1`).trim();
    if (!firstCommit) {
      console.error('Error: No commits found on current branch');
      process.exit(1);
    }
    
    console.log(`Rebasing branch '${currentBranch}' onto its first commit '${firstCommit}'...`);
    executeGitCommand(`git rebase --onto ${firstCommit} ${firstCommit}^ ${currentBranch}`);
  });

// gsc - git stash commit
program
  .command('gsc')
  .description('Pop stash items and commit them')
  .option('-a, --all', 'Pop stash items in order and commit each')
  .action((options) => {
    // Check if there are stash items
    let stashCount;
    try {
      const stashList = executeGitCommand('git stash list');
      stashCount = stashList.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      console.error('Error: Git stash operation failed');
      process.exit(1);
    }
    
    if (stashCount === 0) {
      console.error('Error: No stash items available');
      process.exit(1);
    }
    
    if (options.all) {
      console.log('Popping stash items in order and committing each...');
      
      for (let i = 0; i < stashCount; i++) {
        // Get stash description
        const stashInfo = executeGitCommand('git stash list | head -n 1').trim();
        const stashDescription = stashInfo.split(':').slice(2).join(':').trim().replace(/^On [^:]*: /, '');
        
        console.log();
        console.log(`Popping stash item: stash@{0}`);
        executeGitCommand('git stash pop');
        
        executeGitCommand('git add .');
        console.log(`Committing with message: ${stashDescription}`);
        executeGitCommand(`git commit -m "${stashDescription}"`);
        
        console.log('Successfully committed stash item');
      }
    } else {
      console.log('Popping only the latest stash item...');
      
      // Get latest stash description
      const latestStashInfo = executeGitCommand('git stash list | head -n 1').trim();
      const latestStashDescription = latestStashInfo.split(':').slice(2).join(':').trim().replace(/^On [^:]*: /, '');
      
      executeGitCommand('git stash pop');
      
      executeGitCommand('git add .');
      console.log(`Committing with message: ${latestStashDescription}`);
      executeGitCommand(`git commit -m "${latestStashDescription}"`);
      
      console.log('Successfully committed the latest stash item');
    }
    
    console.log();
    console.log('Stash commit operation completed successfully!');
    console.log('You can view the commits with \'git log\'');
  });

program.parse(process.argv);
