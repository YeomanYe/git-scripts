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

// Get the Nth commit message from HEAD
function getNthCommitMessage(n) {
  const commitHash = executeGitCommand(`git log -${n} --pretty=format:"%H" | tail -1`).trim();
  return executeGitCommand(`git log -1 --pretty=%B ${commitHash}`).trim();
}

// Get the latest (1st) commit message
function getLatestCommitMessage() {
  return executeGitCommand('git log -1 --pretty=%B').trim();
}

// Create a temporary rebase todo file and execute rebase
function executeNonInteractiveRebase(targetRef, squashCount, commitMessage, isHead) {
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

    // Use GIT_SEQUENCE_EDITOR to skip editor, then use exec GIT_EDITOR to set message
    const GIT_SEQUENCE_EDITOR = `cat ${tempFile}`;
    const GIT_EDITOR = `cat ${tempFile} && echo "${commitMessage.replace(/"/g, '\\"')}" > $1`;

    // Get the base commit for soft reset
    const baseCommit = executeGitCommand(`git log -${squashCount + 1} --pretty=format:"%H" | tail -1`).trim();

    console.log(`Squashing ${squashCount} commits...`);

    // Use exec to set environment variables and run git rebase
    // GIT_SEQUENCE_EDITOR avoids opening an editor by reading from our temp file
    const rebaseCmd = `GIT_SEQUENCE_EDITOR="cat ${tempFile}" GIT_EDITOR="cat" git rebase -i --keep-empty ${targetRef} 2>&1 || true`;
    execSync(rebaseCmd, {
      stdio: 'inherit',
      encoding: 'utf8',
      shell: 'bash',
      env: { ...process.env }
    });

    // Now amend the commit with the desired message
    if (isHead) {
      // Use latest commit message - get current HEAD's message and commit hash
      const headCommit = executeGitCommand('git rev-parse HEAD').trim();
      execSync(`git commit --amend -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log(`Updated commit message to: "${commitMessage}"`);
    } else {
      // Use nth commit message - we need to re-create the commit
      // First, soft reset to before the squash, then recommit
      execSync(`git reset --soft ${baseCommit}`, { stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log(`Created new commit with message: "${commitMessage}"`);
    }

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
  .name('grn')
  .description('Interactive rebase for the last N commits')
  .version('1.1.0')
  .argument('[n]', 'Number of commits to rebase')
  .option('-h, --head <n>', 'Squash last N commits, use latest commit message')
  .option('-t, --target <n>', 'Squash last N commits, use Nth commit message')
  .usage('<n> | -h <n> | -t <n>')
  .addHelpText('after', `
Examples:
  $ grn 3        # Rebase last 3 commits interactively
  $ grn 5        # Rebase last 5 commits interactively
  $ grn -h 3     # Squash last 3 commits, use latest message
  $ grn -t 3     # Squash last 3 commits, use 3rd commit message`);
  .action((n, options) => {
    const headOption = options.head;
    const targetOption = options.target;

    // Handle -h option (squash with latest commit message)
    if (headOption) {
      const commits = parseInt(headOption, 10);
      if (isNaN(commits) || commits <= 0) {
        console.error('Error: -h requires a positive integer');
        process.exit(1);
      }
      if (commits < 2) {
        console.error('Error: -h requires at least 2 commits to squash');
        process.exit(1);
      }

      const targetRef = `HEAD~${commits}`;
      const latestMessage = getLatestCommitMessage();
      console.log(`Squashing last ${commits} commits with latest message...`);
      executeNonInteractiveRebase(targetRef, commits, latestMessage, true);
      return;
    }

    // Handle -t option (squash with nth commit message)
    if (targetOption) {
      const commits = parseInt(targetOption, 10);
      if (isNaN(commits) || commits <= 0) {
        console.error('Error: -t requires a positive integer');
        process.exit(1);
      }
      if (commits < 2) {
        console.error('Error: -t requires at least 2 commits to squash');
        process.exit(1);
      }

      const targetRef = `HEAD~${commits}`;
      const nthMessage = getNthCommitMessage(commits);
      console.log(`Squashing last ${commits} commits with ${commits}th commit message...`);
      executeNonInteractiveRebase(targetRef, commits, nthMessage, false);
      return;
    }

    // Original interactive rebase behavior
    if (n === undefined) {
      program.help();
    }

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
