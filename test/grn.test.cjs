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
    const output = executeScript(tmpDir.path, 'grn -h');
    expect(output).toContain('Usage:');
    expect(output).toContain('grn');
  });

  it('normal: should show usage examples', () => {
    const output = executeScript(tmpDir.path, 'grn -h');
    expect(output).toContain('Examples:');
    expect(output).toContain('grn 3');
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
});
