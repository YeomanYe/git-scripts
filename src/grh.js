#!/usr/bin/env node

const { execSync } = require('child_process');
const { Command } = require('commander');
const os = require('os');
const path = require('path');
const fs = require('fs');

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

// Get the latest commit message
function getLatestCommitMessage() {
  return executeGitCommand('git log -1 --pretty=%B').trim();
}

// Create a temporary rebase todo file and execute rebase
function executeSquashRebase(targetRef, squashCount, commitMessage) {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `git-rebase-todo-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  try {
    // Generate rebase todo file:
    // First line: pick (keep the base commit)
    // Second line: squash (merge all commits into the first one)
    const pickCommit = executeGitCommand(`git log -${squashCount + 1} --pretty=format:"%H" | tail -1`).trim();
    const commits = executeGitCommand(`git log -${squashCount} --pretty=format:"%H"`).trim().split('\n').reverse();

    // Write rebase todo file
    let todoContent = `pick ${pickCommit}\n`;
    commits.forEach((commitHash) => {
      if (commitHash.trim()) {
        todoContent += `squash ${commitHash.trim()}\n`;
      }
    });

    fs.writeFileSync(tempFile, todoContent);
    fs.chmodSync(tempFile, 0o600);

    // Get the base commit for soft reset
    const baseCommit = executeGitCommand(`git log -${squashCount + 1} --pretty=format:"%H" | tail -1`).trim();

    console.log(`Squashing ${squashCount} commits...`);

    // Use exec to set environment variables and run git rebase
    const rebaseCmd = `GIT_SEQUENCE_EDITOR="cat ${tempFile}" GIT_EDITOR="cat" git rebase -i --keep-empty ${targetRef} 2>&1 || true`;
    execSync(rebaseCmd, {
      stdio: 'inherit',
      encoding: 'utf8',
      shell: 'bash',
      env: { ...process.env }
    });

    // Now amend the commit with the desired message
    const headCommit = executeGitCommand('git rev-parse HEAD').trim();
    execSync(`git commit --amend -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    console.log(`Updated commit message to: "${commitMessage}"`);

    console.log('Squash completed successfully!');
  } finally {
    // Cleanup temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// Create commander instance
const program = new Command();

// Configure program
program
  .name('grh')
  .description('Rebase current branch onto its first commit, useful for cleaning up branch history')
  .version('1.0.0')
  .option('-m, --message <msg>', 'Rebase and use custom commit message for squashed commits')
  .usage('[-m <msg>]')
  .addHelpText('after', `\nExamples:\n  $ grh                # Rebase to first commit, keep last message\n  $ grh -m "fix"       # Rebase to first commit, use custom message "fix"`)
  .action((options) => {
    let currentBranch;
    try {
      currentBranch = executeGitCommand('git rev-parse --abbrev-ref HEAD').trim();
    } catch (error) {
      console.error('Error: Not currently on a branch');
      process.exit(1);
    }

    const firstCommit = executeGitCommand(`git log --reverse --pretty=format:"%H" | head -1`).trim();
    if (!firstCommit) {
      console.error('Error: No commits found on current branch');
      process.exit(1);
    }

    // Count commits to squash (all commits except the first one)
    const allCommits = executeGitCommand(`git log --pretty=format:"%H"`).trim().split('\n');
    const squashCount = allCommits.length - 1;

    if (squashCount < 1) {
      console.log('Info: Only one commit exists, nothing to rebase');
      process.exit(0);
    }

    const targetRef = firstCommit;
    console.log(`Rebasing branch '${currentBranch}' onto its first commit '${firstCommit}'...`);

    if (options.message) {
      // Use custom message
      executeSquashRebase(targetRef, squashCount, options.message);
    } else {
      // Use latest commit message
      const latestMessage = getLatestCommitMessage();
      console.log(`Squashing ${squashCount} commits with latest message...`);
      executeSquashRebase(targetRef, squashCount, latestMessage);
    }
  });

// Parse arguments
program.parse(process.argv);
