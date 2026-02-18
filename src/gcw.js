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

// Helper function to execute git commands that might fail
function tryExecuteGitCommand(command) {
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    return null;
  }
}

// Get list of all worktrees (excluding the main one)
function getWorktrees() {
  const output = tryExecuteGitCommand('git worktree list --porcelain');
  if (!output) {
    return [];
  }

  const worktrees = [];
  const entries = output.split('\n\n');

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    if (lines.length < 2) continue;

    let path = null;
    let isMain = false;

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        path = line.replace('worktree ', '').trim();
      } else if (line.startsWith('HEAD ')) {
        // Check if it's the main worktree
      } else if (line === 'bare') {
        // Bare repository
      }
    }

    if (path) {
      // Check if this is the main worktree by checking if it's the current directory's worktree
      const mainWorktree = tryExecuteGitCommand('git rev-parse --show-toplevel');
      const currentDir = execSync('pwd', { encoding: 'utf8' }).trim();

      // This is not the main worktree if the path is different from main or current
      // We need to check if it's the main worktree by checking if it's the primary one
      const isMainWorktree = lines.some(line => line === 'bare') === false &&
                            tryExecuteGitCommand(`git -C "${path}" rev-parse --is-inside-work-tree`) !== 'true';

      // Get branch info
      let branch = null;
      for (const line of lines) {
        if (line.startsWith('HEAD ')) {
          branch = line.replace('HEAD ', '').trim();
        }
      }

      // Only add non-main worktrees
      // The main worktree is typically the one where .git is a directory, not a file
      const gitDir = tryExecuteGitCommand('git rev-parse --git-dir');
      const isBare = gitDir === '.' || gitDir === '';

      if (!isBare) {
        // This is a regular worktree, check if it's the main one
        const mainRoot = tryExecuteGitCommand('git rev-parse --show-toplevel');
        if (path !== mainRoot) {
          worktrees.push({ path, branch });
        }
      }
    }
  }

  return worktrees;
}

// Get all worktrees including the main one
function getAllWorktrees() {
  const output = tryExecuteGitCommand('git worktree list --porcelain');
  if (!output) {
    return [];
  }

  const worktrees = [];
  const entries = output.split('\n\n');

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    if (lines.length < 2) continue;

    let path = null;
    let branch = null;
    let isMain = false;

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        path = line.replace('worktree ', '').trim();
      } else if (line.startsWith('HEAD ')) {
        branch = line.replace('HEAD ', '').trim();
      }
    }

    if (path) {
      worktrees.push({ path, branch });
    }
  }

  return worktrees;
}

// Remove a worktree
function removeWorktree(worktreePath, force = false) {
  const args = force ? 'worktree remove --force' : 'worktree remove';
  try {
    executeGitCommand(`git ${args} "${worktreePath}"`);
    console.log(`Removed worktree: ${worktreePath}`);
    return true;
  } catch (error) {
    console.error(`Failed to remove worktree ${worktreePath}: ${error.message}`);
    return false;
  }
}

// Create commander instance
const program = new Command();

// Configure program
program
  .name('gcw')
  .description('Remove all worktrees in the current project (except the main worktree)')
  .version('1.0.0')
  .option('-f, --force', 'Force remove worktrees even if they have uncommitted changes')
  .option('-a, --all', 'Include the main worktree (dangerous - removes the main directory)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .usage('[-f] [-a] [-y]')
  .addHelpText('after', `
Examples:
  $ gcw                # Remove all worktrees except main (prompts for confirmation)
  $ gcw -f             # Force remove worktrees without checking for uncommitted changes
  $ gcw -y             # Skip confirmation and remove all worktrees
  $ gcw -a             # Remove ALL worktrees including the main worktree directory

Warning: This command will delete the worktree directories. Make sure to backup any important work before running.`)
  .action((options) => {
    const allWorktrees = getAllWorktrees();
    const mainWorktree = tryExecuteGitCommand('git rev-parse --show-toplevel');

    // Filter worktrees to remove
    let worktreesToRemove = allWorktrees.filter(wt => wt.path !== mainWorktree);

    if (options.all) {
      worktreesToRemove = allWorktrees;
    }

    if (worktreesToRemove.length === 0) {
      console.log('No worktrees to remove.');
      return;
    }

    // Display worktrees that will be removed
    console.log('Worktrees to be removed:');
    for (const wt of worktreesToRemove) {
      const indicator = wt.path === mainWorktree ? ' [MAIN]' : '';
      console.log(`  - ${wt.path} (${wt.branch || 'detached'})${indicator}`);
    }
    console.log('');

    // Skip confirmation if --yes is provided
    if (!options.yes) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('Are you sure you want to remove these worktrees? (y/N) ', (answer) => {
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log('Operation cancelled.');
          process.exit(0);
        }
        executeRemoval(worktreesToRemove, options.force, options.all);
      });
    } else {
      executeRemoval(worktreesToRemove, options.force, options.all);
    }
  });

function executeRemoval(worktrees, force, includeMain) {
  const mainWorktree = tryExecuteGitCommand('git rev-parse --show-toplevel');
  let removedCount = 0;
  let failedCount = 0;

  for (const wt of worktrees) {
    const isMain = wt.path === mainWorktree;
    if (isMain && !includeMain) {
      console.log(`Skipping main worktree: ${wt.path}`);
      continue;
    }

    console.log(`\nRemoving worktree: ${wt.path}`);
    if (removeWorktree(wt.path, force)) {
      removedCount++;
    } else {
      failedCount++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Removed: ${removedCount} worktree(s)`);
  if (failedCount > 0) {
    console.log(`Failed: ${failedCount} worktree(s)`);
    process.exit(1);
  }
}

// Parse arguments
program.parse(process.argv);
