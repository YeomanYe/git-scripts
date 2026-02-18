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

// Helper function to execute git commands that might fail
function tryExecuteGitCommand(command) {
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    return null;
  }
}

// Get the latest commit message
function getLatestCommitMessage() {
  return executeGitCommand('git log -1 --pretty=%B').trim();
}

// Find the base commit for rebase (where current branch diverged)
function getRemoteBaseCommit() {
  const headCommit = tryExecuteGitCommand('git rev-parse HEAD');
  if (!headCommit) {
    return null;
  }

  const currentBranch = tryExecuteGitCommand('git rev-parse --abbrev-ref HEAD');

  // Try to get the upstream branch of current local branch first
  const upstreamBranch = tryExecuteGitCommand('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
  if (upstreamBranch) {
    const remoteBranch = upstreamBranch.replace(/^[^/]+\//, ''); // Remove local branch prefix
    const baseCommit = tryExecuteGitCommand(`git merge-base HEAD ${remoteBranch}`);
    if (baseCommit && baseCommit !== headCommit) {
      return { branch: remoteBranch, commit: baseCommit };
    }
  }

  // Use git log to find which remote branch is in current branch's history
  const priorityBranches = ['master', 'main', 'develop'];

  // Try to find remote branch in commit history
  const remoteBranches = tryExecuteGitCommand('git branch -r');
  if (remoteBranches && !remoteBranches.includes('No remote branches')) {
    const allRemoteBranches = remoteBranches
      .split('\n')
      .map(b => b.trim())
      .filter(b => (b.startsWith('origin/') || b.startsWith('upstream/')) && !b.includes('->'));

    // Priority: master, main, develop
    for (const priority of priorityBranches) {
      const branch = allRemoteBranches.find(b => b.endsWith(`/${priority}`));
      if (branch) {
        // Check if this remote branch is ancestor of HEAD using git log
        const logOutput = tryExecuteGitCommand(`git log --oneline ${branch}..HEAD`);
        if (logOutput !== '') {
          // There are commits between remote branch and HEAD
          // Use the remote branch itself as base
          const remoteCommit = tryExecuteGitCommand(`git rev-parse ${branch}`);
          if (remoteCommit && remoteCommit !== headCommit) {
            return { branch, commit: remoteCommit };
          }
        } else {
          // No commits between remote and HEAD, remote is ahead or same
          // Use remote branch as base
          const remoteCommit = tryExecuteGitCommand(`git rev-parse ${branch}`);
          if (remoteCommit && remoteCommit !== headCommit) {
            return { branch, commit: remoteCommit };
          }
        }
      }
    }
  }

  // Fallback: try local branches
  const localBranches = tryExecuteGitCommand('git branch');
  if (localBranches) {
    const localBranchList = localBranches
      .split('\n')
      .map(b => b.trim())
      .filter(b => b && b !== currentBranch && !b.startsWith('*'));

    for (const priority of priorityBranches) {
      const branch = localBranchList.find(b => b === priority);
      if (branch) {
        const baseCommit = tryExecuteGitCommand(`git merge-base HEAD ${branch}`);
        if (baseCommit && baseCommit !== headCommit) {
          return { branch, commit: baseCommit };
        }
      }
    }
  }

  return null;
}

// Execute squash rebase using interactive rebase
function executeSquashRebase(targetRef, squashCount, commitMessage) {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `git-rebase-todo-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  try {
    // Get the commits to squash (from target to HEAD, exclusive of target)
    // Use --no-merges to exclude merge commits (cannot squash merge commits)
    const commits = executeGitCommand(`git log ${targetRef}..HEAD --no-merges --pretty=format:"%H"`).trim().split('\n').filter(c => c);

    if (commits.length === 0) {
      console.log('Nothing to squash. No commits after the target.');
      return;
    }

    // Generate rebase todo file
    // First line: pick (keep the first commit after target)
    // Rest: squash (merge all other commits into the first one)
    let todoContent = '';
    for (let i = 0; i < commits.length; i++) {
      if (i === 0) {
        todoContent += `pick ${commits[i]}\n`;
      } else {
        todoContent += `squash ${commits[i]}\n`;
      }
    }

    fs.writeFileSync(tempFile, todoContent);
    fs.chmodSync(tempFile, 0o600);

    console.log(`Squashing ${squashCount} commits...`);

    // Execute interactive rebase with custom editor that uses our todo file
    const editorScript = path.join(tempDir, `git-editor-${Date.now()}.sh`);
    const editorContent = `#!/bin/bash
cat "${tempFile}" > "$1"
`;
    fs.writeFileSync(editorScript, editorContent);
    fs.chmodSync(editorScript, 0o755);

    execSync(`git rebase -i ${targetRef}`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        GIT_SEQUENCE_EDITOR: editorScript,
        GIT_EDITOR: editorScript,
      },
    });

    // Amend the commit with the desired message
    execSync(`git commit --amend -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    console.log(`Updated commit message to: "${commitMessage}"`);

    console.log('Squash completed successfully!');
  } catch (error) {
    console.error('Rebase failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup temp files
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    const editorScript = path.join(tempDir, `git-editor-${Date.now()}.sh`);
    if (fs.existsSync(editorScript)) {
      fs.unlinkSync(editorScript);
    }
  }
}

// Create commander instance
const program = new Command();

// Configure program
program
  .name('grh')
  .description('Rebase current branch onto remote/base commit, useful for cleaning up branch history')
  .version('1.0.0')
  .option('-m, --message <msg>', 'Rebase and use custom commit message for squashed commits')
  .usage('[-m <msg>]')
  .addHelpText('after', `
Examples:
  $ grh                # Rebase onto remote base, keep last message
  $ grh -m "fix"       # Rebase onto remote base, use custom message "fix"

If no remote branch is found, rebases onto the first commit.`)
  .action((options) => {
    let currentBranch;
    try {
      currentBranch = executeGitCommand('git rev-parse --abbrev-ref HEAD').trim();
    } catch (error) {
      console.error('Error: Not currently on a branch');
      process.exit(1);
    }

    // Try to find remote base commit
    const remoteBase = getRemoteBaseCommit();
    let targetRef;
    let targetDescription;

    if (remoteBase) {
      targetRef = remoteBase.commit;
      targetDescription = `remote ${remoteBase.branch}`;
    } else {
      // Fall back to first commit
      targetRef = executeGitCommand(`git log --reverse --pretty=format:"%H" | head -1`).trim();
      targetDescription = 'first commit';
    }

    if (!targetRef) {
      console.error('Error: No commits found on current branch');
      process.exit(1);
    }

    // Get commits between target and HEAD
    const commits = executeGitCommand(`git log ${targetRef}..HEAD --pretty=format:"%H"`).trim().split('\n').filter(c => c);
    const squashCount = commits.length;

    if (squashCount < 1) {
      console.log('Info: No commits to squash after the target');
      process.exit(0);
    }

    console.log(`Rebasing branch '${currentBranch}' onto its ${targetDescription} '${targetRef}'...`);

    if (options.message) {
      executeSquashRebase(targetRef, squashCount, options.message);
    } else {
      const latestMessage = getLatestCommitMessage();
      console.log(`Squashing ${squashCount} commits with latest message...`);
      executeSquashRebase(targetRef, squashCount, latestMessage);
    }
  });

// Parse arguments
program.parse(process.argv);
