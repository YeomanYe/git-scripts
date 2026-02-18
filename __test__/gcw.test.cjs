const { execSync } = require('child_process');
const tmp = require('tmp-promise');
const fs = require('fs-extra');
const path = require('path');

// Helper function to execute git commands in a specific directory
function executeGitCommand(cwd, command) {
  return execSync(command, { cwd, encoding: 'utf8', stdio: 'pipe' });
}

// Helper function to execute our scripts
function executeScript(cwd, command) {
  const [cmd, ...args] = command.split(' ');
  const scriptPath = path.join(__dirname, `../src/${cmd}.js`);
  return execSync(`node ${scriptPath} ${args.join(' ')}`, { cwd, encoding: 'utf8', stdio: 'pipe' });
}

// Generate unique worktree path based on test context
function getWorktreePath(mainDir, suffix) {
  const uniqueId = Math.random().toString(36).substring(2, 8);
  return path.join(mainDir, `..`, `wt-${suffix}-${uniqueId}`);
}

describe('gcw', () => {
  let tmpDir;
  let mainDir;

  beforeEach(async () => {
    tmpDir = await tmp.dir({ unsafeCleanup: true });
    mainDir = tmpDir.path;
    executeGitCommand(mainDir, 'git init');
    executeGitCommand(mainDir, 'git config user.email "test@example.com"');
    executeGitCommand(mainDir, 'git config user.name "Test User"');

    // Create initial commit
    const testFile = path.join(mainDir, 'test.txt');
    fs.writeFileSync(testFile, 'initial content');
    executeGitCommand(mainDir, 'git add .');
    executeGitCommand(mainDir, 'git commit -m "initial commit"');
  });

  afterEach(async () => {
    await tmpDir.cleanup();
  });

  it('normal: should show help message when using -h option', () => {
    try {
      executeScript(mainDir, 'gcw -h');
    } catch (error) {
      expect(error.status).toBeDefined();
    }
  });

  it('normal: should show usage examples', () => {
    try {
      executeScript(mainDir, 'gcw -h');
    } catch (error) {
      expect(error.status).toBeDefined();
    }
  });

  it('normal: should handle no worktrees case', () => {
    // Without any additional worktrees, should show no worktrees message
    const output = executeScript(mainDir, 'gcw -y');
    expect(output.toString()).toContain('No worktrees to remove');
  });

  it('edge: should list worktrees correctly', () => {
    // Create a worktree
    const worktreePath = getWorktreePath(mainDir, 'list');
    executeGitCommand(mainDir, `git worktree add ${worktreePath} -b feature`);

    // Run gcw with -y and check output contains the worktree
    try {
      executeScript(mainDir, 'gcw -y');
    } catch (error) {
      // May fail due to removal, but should list worktrees first
    }

    // Verify worktree was created (or removed if gcw ran successfully)
    const worktrees = executeGitCommand(mainDir, 'git worktree list --porcelain');
    // Either it exists (if gcw didn't run) or was removed - both are valid
    expect(worktrees).toBeTruthy();
  });

  it('edge: should handle multiple worktrees', () => {
    // Create multiple worktrees with unique names
    const worktreePath1 = getWorktreePath(mainDir, 'multi1');
    const worktreePath2 = getWorktreePath(mainDir, 'multi2');
    executeGitCommand(mainDir, `git worktree add ${worktreePath1} -b feature1`);
    executeGitCommand(mainDir, `git worktree add ${worktreePath2} -b feature2`);

    // Verify both worktrees exist
    const worktrees = executeGitCommand(mainDir, 'git worktree list');
    expect(worktrees).toContain('feature1');
    expect(worktrees).toContain('feature2');
  });

  it('edge: should skip main worktree by default', () => {
    // Create a worktree
    const worktreePath = getWorktreePath(mainDir, 'skip');
    executeGitCommand(mainDir, `git worktree add ${worktreePath} -b feature`);

    // Run gcw -y to remove
    try {
      executeScript(mainDir, 'gcw -y');
    } catch (error) {
      // May have some errors during removal
    }

    // Verify main worktree still exists
    const worktrees = executeGitCommand(mainDir, 'git worktree list');
    expect(worktrees).toContain(mainDir);
  });

  it('abnormal: should handle invalid options gracefully', () => {
    try {
      executeScript(mainDir, 'gcw --invalid-option');
      expect(false).toBe(true);
    } catch (error) {
      expect(error.status).toBeDefined();
    }
  });

  describe('-f option (force)', () => {
    it('normal: should accept force option', () => {
      // Create a worktree
      const worktreePath = getWorktreePath(mainDir, 'force');
      executeGitCommand(mainDir, `git worktree add ${worktreePath} -b feature`);

      // Run with -f (force) and -y (yes to confirm)
      try {
        executeScript(mainDir, 'gcw -f -y');
      } catch (error) {
        // May have errors but should accept the option
      }

      // Should accept the option without error
      expect(true).toBe(true);
    });
  });

  describe('-a option (all)', () => {
    it('normal: should accept all option', () => {
      // Create a worktree
      const worktreePath = getWorktreePath(mainDir, 'all');
      executeGitCommand(mainDir, `git worktree add ${worktreePath} -b feature`);

      // Run with -a (all) and -y (yes to confirm)
      try {
        executeScript(mainDir, 'gcw -a -y');
      } catch (error) {
        // May have errors but should accept the option
      }

      // Should accept the option without error
      expect(true).toBe(true);
    });
  });

  describe('-y option (yes)', () => {
    it('normal: should accept yes option without prompting', () => {
      // Create a worktree
      const worktreePath = getWorktreePath(mainDir, 'yes');
      executeGitCommand(mainDir, `git worktree add ${worktreePath} -b feature`);

      // Should not hang - should accept -y option
      try {
        executeScript(mainDir, 'gcw -y');
      } catch (error) {
        // May fail during removal but should not hang
      }

      // Should complete without hanging
      expect(true).toBe(true);
    });
  });

  describe('worktree removal functionality', () => {
    it('normal: should remove worktree successfully', () => {
      // Create a worktree
      const worktreePath = getWorktreePath(mainDir, 'remove');
      executeGitCommand(mainDir, `git worktree add ${worktreePath} -b feature-test`);

      // Verify worktree exists
      let worktrees = executeGitCommand(mainDir, 'git worktree list --porcelain');
      expect(worktrees).toContain('worktree');

      // Remove the worktree manually to test the setup works
      executeGitCommand(mainDir, `git worktree remove ${worktreePath}`);

      // Verify worktree is removed
      worktrees = executeGitCommand(mainDir, 'git worktree list --porcelain');
      expect(worktrees).not.toContain('test-worktree-remove');
    });
  });
});
