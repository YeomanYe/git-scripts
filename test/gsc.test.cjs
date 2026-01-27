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

  it('should pop and commit all stash items when using -a option', () => {
    // Create a test file for initial commit
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
    
    // Create multiple stash items with different files to avoid conflicts
    const stashDescriptions = ['stash 1', 'stash 2', 'stash 3'];
    for (let i = 0; i < stashDescriptions.length; i++) {
      const desc = stashDescriptions[i];
      const stashFile = path.join(tmpDir.path, `stash-${i + 1}.txt`);
      
      // Create a new file and stash
      fs.writeFileSync(stashFile, desc);
      executeGitCommand(tmpDir.path, 'git add ' + stashFile);
      executeGitCommand(tmpDir.path, 'git stash push -m "' + desc + '"');
      // Don't revert anything, just continue with next stash
    }
    
    // Execute gsc -a command
    executeScript(tmpDir.path, 'gsc -a');
    
    // Verify stash list is empty
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList).toBe('');
    
    // Verify all stash items were committed
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    for (const desc of stashDescriptions) {
      expect(log).toContain(desc);
    }
    
    // Verify the commit count (initial + 3 stashes)
    const commitCount = log.split('\n').filter(line => line.trim()).length;
    expect(commitCount).toBe(4);
  });
});
