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

describe('gsc', () => {
  let tmpDir;
  
  beforeEach(async () => {
    // Create a temporary directory for each test
    tmpDir = await tmp.dir({ unsafeCleanup: true });
    
    // Initialize a git repository
    executeGitCommand(tmpDir.path, 'git init');
    executeGitCommand(tmpDir.path, 'git config user.email "test@example.com"');
    executeGitCommand(tmpDir.path, 'git config user.name "Test User"');
  });
  
  afterEach(async () => {
    // Clean up the temporary directory
    await tmpDir.cleanup();
  });
  
  it('should pop stash and commit', () => {
    // Create a test file
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
    
    // Modify the file and stash
    fs.writeFileSync(testFile, 'modified content');
    executeGitCommand(tmpDir.path, 'git stash push -m "modified content"');
    
    // Execute gsc command
    executeScript(tmpDir.path, 'gsc');
    
    // Verify the stash was popped and committed
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList).toBe('');
    
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('modified content');
  });
  
  it('should show help message when using -h option', () => {
    // Execute gsc with -h option
    const output = executeScript(tmpDir.path, 'gsc -h');
    
    // Verify help message is displayed
    expect(output).toContain('Usage: gsc');
    expect(output).toContain('Pop stash items and commit them with their original descriptions');
  });
});
