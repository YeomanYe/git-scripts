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

describe('gcr', () => {
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
  
  it('should clean the repository', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
    
    // Create a test file that will be stashed
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    
    // Execute gcr command
    executeScript(tmpDir.path, 'gcr');
    
    // Verify the file is no longer tracked
    const status = executeGitCommand(tmpDir.path, 'git status --porcelain');
    expect(status).not.toContain('test.txt');
  });
  
  it('should not drop a pre-existing stash when the working tree is clean', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');

    // User stashes some work, creating a pre-existing stash entry.
    fs.writeFileSync(path.join(tmpDir.path, 'precious.txt'), 'do not lose me');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git stash -u');

    // Working tree is now clean. Running gcr must NOT touch the existing stash.
    executeScript(tmpDir.path, 'gcr');

    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList).toContain('stash@{0}');

    // And the stashed file is recoverable.
    executeGitCommand(tmpDir.path, 'git stash pop');
    const status = executeGitCommand(tmpDir.path, 'git status --porcelain');
    expect(status).toContain('precious.txt');
  });

  it('should drop the stash it creates when cleaning untracked files', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');

    // Create an untracked file to clean.
    fs.writeFileSync(path.join(tmpDir.path, 'test.txt'), 'test content');

    executeScript(tmpDir.path, 'gcr');

    // The file is gone and gcr left no leftover stash behind.
    const status = executeGitCommand(tmpDir.path, 'git status --porcelain');
    expect(status).not.toContain('test.txt');
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList.trim()).toBe('');
  });

  it('should show help message when using -h option', () => {
    // Execute gcr with -h option
    const output = executeScript(tmpDir.path, 'gcr -h');
    
    // Verify help message is displayed
    expect(output).toContain('Usage: gcr');
    expect(output).toContain('Clean git repository by removing all untracked files and directories');
  });
});
