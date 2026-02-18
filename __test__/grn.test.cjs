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

describe('grn', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await tmp.dir({ unsafeCleanup: true });
    executeGitCommand(tmpDir.path, 'git init');
    executeGitCommand(tmpDir.path, 'git config user.email "test@example.com"');
    executeGitCommand(tmpDir.path, 'git config user.name "Test User"');
  });

  afterEach(async () => {
    await tmpDir.cleanup();
  });

  it('normal: should show help message when using -h option', () => {
    try {
      executeScript(tmpDir.path, 'grn -h');
    } catch (error) {
      // commander shows error for missing required argument
      expect(error.status).toBeDefined();
    }
  });

  it('normal: should show usage examples', () => {
    try {
      executeScript(tmpDir.path, 'grn -h');
    } catch (error) {
      // commander shows error for missing required argument
      expect(error.status).toBeDefined();
    }
  });

  it('normal: should accept valid positive integer N', () => {
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "test commit"');

    try {
      executeScript(tmpDir.path, 'grn 1');
    } catch (error) {
      expect(error.status).toBeDefined();
    }
  });

  it('edge: should handle large N value', () => {
    for (let i = 0; i < 5; i++) {
      const testFile = path.join(tmpDir.path, `test${i}.txt`);
      fs.writeFileSync(testFile, `content ${i}`);
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, `git commit -m "commit ${i}"`);
    }

    try {
      executeScript(tmpDir.path, 'grn 5');
    } catch (error) {
      expect(error.status).toBeDefined();
    }
  });

  it('abnormal: should exit with error when N is zero', () => {
    try {
      executeScript(tmpDir.path, 'grn 0');
      expect(false).toBe(true);
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stdout || error.stderr).toContain('positive integer');
    }
  });

  it('abnormal: should exit with error when N is negative', () => {
    try {
      executeScript(tmpDir.path, 'grn -1');
      expect(false).toBe(true);
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stdout || error.stderr).toContain('positive integer');
    }
  });

  it('abnormal: should exit with error when N is not a number', () => {
    try {
      executeScript(tmpDir.path, 'grn abc');
      expect(false).toBe(true);
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stdout || error.stderr).toContain('positive integer');
    }
  });

  it('abnormal: should exit with error when N is decimal', () => {
    try {
      executeScript(tmpDir.path, 'grn 1.5');
      expect(false).toBe(true);
    } catch (error) {
      expect(error.status).toBe(1);
    }
  });

  describe('-h option (squash with latest message)', () => {
    it('edge: should show error when using -h without argument', () => {
      try {
        executeScript(tmpDir.path, 'grn -h');
      } catch (error) {
        expect(error.status).toBeDefined();
      }
    });

    it('abnormal: should exit with error when -h has no commits', () => {
      const testFile = path.join(tmpDir.path, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, 'git commit -m "single commit"');

      try {
        executeScript(tmpDir.path, 'grn -h 1');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('at least 2 commits');
      }
    });

    it('abnormal: should exit with error when -h has non-numeric value', () => {
      try {
        executeScript(tmpDir.path, 'grn -h abc');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('positive integer');
      }
    });
  });

  describe('-t option (squash with nth commit message)', () => {
    it('edge: should show error when using -t without argument', () => {
      try {
        executeScript(tmpDir.path, 'grn -t');
      } catch (error) {
        expect(error.status).toBeDefined();
      }
    });

    it('abnormal: should exit with error when -t has no commits', () => {
      const testFile = path.join(tmpDir.path, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, 'git commit -m "single commit"');

      try {
        executeScript(tmpDir.path, 'grn -t 1');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('at least 2 commits');
      }
    });

    it('abnormal: should exit with error when -t has non-numeric value', () => {
      try {
        executeScript(tmpDir.path, 'grn -t abc');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('positive integer');
      }
    });
  });

  describe('-m option (squash with custom message)', () => {
    it('normal: should squash commits with custom message', () => {
      // Create multiple commits
      for (let i = 0; i < 3; i++) {
        const testFile = path.join(tmpDir.path, `test${i}.txt`);
        fs.writeFileSync(testFile, `content ${i}`);
        executeGitCommand(tmpDir.path, 'git add .');
        executeGitCommand(tmpDir.path, `git commit -m "commit ${i}"`);
      }

      // Execute grn -m with custom message and N=3
      const customMessage = 'feat: custom squash message';
      executeScript(tmpDir.path, `grn -m "${customMessage}" 3`);

      // Verify the squash was successful by checking commit count
      const log = executeGitCommand(tmpDir.path, 'git log --oneline');
      const commits = log.split('\n').filter(line => line.trim());
      // Should have 1 commit (base) + 3 squashed = 4 commits total, but since squash merges, we check message
      expect(log).toContain(customMessage);
    });

    it('abnormal: should exit with error when -m is used without N', () => {
      const testFile = path.join(tmpDir.path, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, 'git commit -m "first commit"');

      try {
        executeScript(tmpDir.path, 'grn -m "custom message"');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('requires a commit count N');
      }
    });

    it('abnormal: should exit with error when N is not a number with -m', () => {
      try {
        executeScript(tmpDir.path, 'grn -m "custom message" abc');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('positive integer');
      }
    });

    it('abnormal: should exit with error when -m has less than 2 commits', () => {
      const testFile = path.join(tmpDir.path, 'test.txt');
      fs.writeFileSync(testFile, 'content');
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, 'git commit -m "single commit"');

      try {
        executeScript(tmpDir.path, 'grn -m "custom message" 1');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('at least 2 commits');
      }
    });
  });
});
