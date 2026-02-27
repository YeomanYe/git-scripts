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

describe('gac', () => {
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
  
  it('should add and commit changes', () => {
    // Create a test file
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    
    // Execute gac command
    executeScript(tmpDir.path, 'gac "test commit"');
    
    // Verify the commit was created
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('test commit');
  });
  
  it('should show help message when using -h option', () => {
    // Execute gac with -h option
    const output = executeScript(tmpDir.path, 'gac -h');

    // Verify help message is displayed
    expect(output).toContain('Usage: gac');
    expect(output).toContain('Quickly add all changes and commit with the provided message');
  });

  it('normal: should accept -n option to skip commit hooks', () => {
    // Create a test file
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');

    // Execute gac command with -n option
    executeScript(tmpDir.path, 'gac -n "test commit with -n"');

    // Verify the commit was created
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('test commit with -n');
  });
});
