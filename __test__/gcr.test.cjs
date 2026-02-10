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
  
  it('should show help message when using -h option', () => {
    // Execute gcr with -h option
    const output = executeScript(tmpDir.path, 'gcr -h');
    
    // Verify help message is displayed
    expect(output).toContain('Usage: gcr');
    expect(output).toContain('Clean git repository by removing all untracked files and directories');
  });
});
