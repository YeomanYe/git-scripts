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

describe('gme', () => {
  let tmpDir;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tmpDir = await tmp.dir({ unsafeCleanup: true });

    // Initialize a git repository
    executeGitCommand(tmpDir.path, 'git init');
    executeGitCommand(tmpDir.path, 'git config user.email "test@example.com"');
    executeGitCommand(tmpDir.path, 'git config user.name "Test User"');

    // Create initial commit so we can make more commits
    const testFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(testFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
  });

  afterEach(async () => {
    // Clean up the temporary directory
    await tmpDir.cleanup();
  });

  it('normal: should commit changes with provided message', () => {
    // Create a test file and stage it
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    executeGitCommand(tmpDir.path, 'git add .');

    // Execute gme command
    executeScript(tmpDir.path, 'gme "test commit"');

    // Verify the commit was created
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('test commit');
  });

  it('normal: should commit with feat prefix message', () => {
    // Create and stage a file
    const testFile = path.join(tmpDir.path, 'feature.txt');
    fs.writeFileSync(testFile, 'feature content');
    executeGitCommand(tmpDir.path, 'git add .');

    // Execute gme with feat message
    executeScript(tmpDir.path, 'gme "feat: add new feature"');

    // Verify the commit
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('feat: add new feature');
  });

  it('normal: should commit with fix prefix message', () => {
    // Create and stage a file
    const testFile = path.join(tmpDir.path, 'fix.txt');
    fs.writeFileSync(testFile, 'fix content');
    executeGitCommand(tmpDir.path, 'git add .');

    // Execute gme with fix message
    executeScript(tmpDir.path, 'gme "fix: resolve bug"');

    // Verify the commit
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('fix: resolve bug');
  });

  it('edge: should handle empty commit message', () => {
    // This tests behavior with empty message - git will fail but that's expected
    const testFile = path.join(tmpDir.path, 'empty.txt');
    fs.writeFileSync(testFile, 'empty content');
    executeGitCommand(tmpDir.path, 'git add .');

    // Execute gme - should fail because git requires a message
    expect(() => {
      executeScript(tmpDir.path, 'gme ""');
    }).toThrow();
  });

  it('abnormal: should fail when no staged changes', () => {
    // Don't stage any changes
    // Execute gme - should fail because nothing to commit
    expect(() => {
      executeScript(tmpDir.path, 'gme "this should fail"');
    }).toThrow();
  });

  it('should show help message when using -h option', () => {
    // Execute gme with -h option
    const output = executeScript(tmpDir.path, 'gme -h');

    // Verify help message is displayed
    expect(output).toContain('Usage: gme');
    expect(output).toContain('git commit -m');
  });
});
