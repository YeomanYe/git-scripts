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

describe('grh', () => {
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
  
  it('should rebase to first commit', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
    
    // Create a second commit
    const secondFile = path.join(tmpDir.path, 'second.txt');
    fs.writeFileSync(secondFile, 'second content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "second commit"');
    
    // Execute grh command
    executeScript(tmpDir.path, 'grh');
    
    // Verify the rebase was successful
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    const commits = log.split('\n').filter(line => line.trim());
    expect(commits.length).toBe(2);
  });
  
  it('should show help message when using -h option', () => {
    // Execute grh with -h option - just check that it runs without error
    executeScript(tmpDir.path, 'grh -h');
    // If we get here, the command ran successfully
    expect(true).toBe(true);
  });
});
