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

  it('normal: should handle escaped double quotes in message', () => {
    // Create a test file
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');

    // Execute gac command with escaped double quotes
    // Input: "test \"quote\" here" → should become: test "quote" here
    executeScript(tmpDir.path, 'gac "test \\"quote\\" here"');

    // Verify the commit was created with the double quotes
    const log = executeGitCommand(tmpDir.path, 'git log --oneline -1 --format="%B"');
    expect(log).toContain('test "quote" here');
  });

  it('normal: should handle single quotes in message', () => {
    // Create a test file
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');

    // Single quotes don't need escaping when using double quotes around the argument
    // Input: "test 'quote' here" → should become: test 'quote' here
    executeScript(tmpDir.path, 'gac "test \'quote\' here"');

    // Verify the commit was created with the single quotes
    const log = executeGitCommand(tmpDir.path, 'git log --oneline -1 --format="%B"');
    expect(log).toContain("test 'quote' here");
  });

  it('normal: should handle both escaped double and single quotes', () => {
    // Create a test file
    const testFile = path.join(tmpDir.path, 'test.txt');
    fs.writeFileSync(testFile, 'test content');

    // Execute gac command with both quotes - escaped double quotes, plain single quotes
    // Input: "test \"double\" and 'single'" → should become: test "double" and 'single'
    executeScript(tmpDir.path, 'gac "test \\"double\\" and \'single\'"');

    // Verify the commit was created with both quotes
    const log = executeGitCommand(tmpDir.path, 'git log --oneline -1 --format="%B"');
    expect(log).toContain('test "double" and \'single\'');
  });
});
