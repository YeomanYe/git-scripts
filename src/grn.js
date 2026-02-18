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

// Get the Nth commit message from HEAD
function getNthCommitMessage(n) {
  const commitHash = executeGitCommand(`git log -${n} --pretty=format:"%H" | tail -1`).trim();
  return executeGitCommand(`git log -1 --pretty=%B ${commitHash}`).trim();
}

// Get the latest (1st) commit message
function getLatestCommitMessage() {
  return executeGitCommand('git log -1 --pretty=%B').trim();
}

// Squash commits and create a new commit with the given message
function executeNonInteractiveRebase(targetRef, squashCount, commitMessage) {
  console.log(`Squashing ${squashCount} commits...`);

  // Get the base commit (the commit before the ones we're squashing)
  const baseCommit = executeGitCommand(`git log -${squashCount + 1} --pretty=format:"%H" | tail -1`).trim();

  // Soft reset to the base commit (keeps all changes staged)
  execSync(`git reset --soft ${baseCommit}`, { stdio: 'inherit' });

  // Check if there are any staged changes to commit
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (!statusOutput) {
    console.log('Nothing to commit. The commits may have already been squashed or there are no changes.');
    return;
  }

  // Create a new commit with the desired message
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  console.log(`Created new commit with message: "${commitMessage}"`);

  console.log('Squash completed successfully!');
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
  .option('-m, --message <msg>', 'Squash last N commits, use custom commit message')
  .usage('<n> | -h <n> | -t <n> | -m <msg> <n>')
  .addHelpText('after', `
Examples:
  $ grn 3                # Rebase last 3 commits interactively
  $ grn 5                # Rebase last 5 commits interactively
  $ grn -h 3             # Squash last 3 commits, use latest message
  $ grn -t 3             # Squash last 3 commits, use 3rd commit message
  $ grn -m "fix" 3       # Squash last 3 commits, use custom message "fix"`)
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
      executeNonInteractiveRebase(targetRef, commits, latestMessage);
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
      executeNonInteractiveRebase(targetRef, commits, nthMessage);
      return;
    }

    // Handle -m option (squash with custom commit message)
    if (options.message !== undefined) {
      const commits = parseInt(n, 10);
      if (n === undefined) {
        console.error('Error: -m requires a commit count N');
        process.exit(1);
      }
      if (isNaN(commits) || commits <= 0) {
        console.error('Error: N must be a positive integer');
        process.exit(1);
      }
      if (commits < 2) {
        console.error('Error: -m requires at least 2 commits to squash');
        process.exit(1);
      }

      const targetRef = `HEAD~${commits}`;
      const customMessage = options.message;
      console.log(`Squashing last ${commits} commits with custom message: "${customMessage}"`);
      executeNonInteractiveRebase(targetRef, commits, customMessage);
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
