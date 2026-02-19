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

    // Create initial commit on master
    const testFile = path.join(tmpDir.path, 'master.txt');
    fs.writeFileSync(testFile, 'master content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
  });

  afterEach(async () => {
    // Clean up the temporary directory
    await tmpDir.cleanup();
  });

  it('normal: should merge a branch', () => {
    // Create a new branch and make a commit
    executeGitCommand(tmpDir.path, 'git checkout -b feature');
    const featureFile = path.join(tmpDir.path, 'feature.txt');
    fs.writeFileSync(featureFile, 'feature content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "feature commit"');

    // Switch back to master
    executeGitCommand(tmpDir.path, 'git checkout master');

    // Execute gme to merge the feature branch
    executeScript(tmpDir.path, 'gme feature');

    // Verify the merge was successful
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('feature commit');
    expect(log).toContain('initial commit');
  });

  it('normal: should merge by commit hash', () => {
    // Create a new branch and make a commit
    executeGitCommand(tmpDir.path, 'git checkout -b feature');
    const featureFile = path.join(tmpDir.path, 'feature.txt');
    fs.writeFileSync(featureFile, 'feature content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "feature commit"');

    // Get the commit hash
    const commitHash = executeGitCommand(tmpDir.path, 'git rev-parse HEAD').trim();

    // Switch back to master
    executeGitCommand(tmpDir.path, 'git checkout master');

    // Execute gme to merge by commit hash
    executeScript(tmpDir.path, `gme ${commitHash}`);

    // Verify the merge was successful
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('feature commit');
  });

  it('normal: should merge with --no-ff option', () => {
    // Create a new branch and make a commit
    executeGitCommand(tmpDir.path, 'git checkout -b feature');
    const featureFile = path.join(tmpDir.path, 'feature.txt');
    fs.writeFileSync(featureFile, 'feature content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "feature commit"');

    // Switch back to master and make another commit so it's not fast-forward
    executeGitCommand(tmpDir.path, 'git checkout master');
    const masterFile = path.join(tmpDir.path, 'master2.txt');
    fs.writeFileSync(masterFile, 'master content 2');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "master commit"');

    // Execute gme with --no-ff option
    executeScript(tmpDir.path, 'gme --no-ff feature');

    // Verify the merge commit was created
    const log = executeGitCommand(tmpDir.path, 'git log --oneline');
    expect(log).toContain('Merge branch');
  });

  it('edge: should fail when merge has conflicts', () => {
    // Create a new branch and modify the same file differently
    executeGitCommand(tmpDir.path, 'git checkout -b feature');

    // Modify master.txt in feature branch
    const featureFile = path.join(tmpDir.path, 'master.txt');
    fs.writeFileSync(featureFile, 'feature modified');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "modify file"');

    // Switch back to master
    executeGitCommand(tmpDir.path, 'git checkout master');

    // Modify master.txt in master branch
    fs.writeFileSync(featureFile, 'master modified');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "modify file in master"');

    // Execute gme - should fail due to conflict
    expect(() => {
      executeScript(tmpDir.path, 'gme feature');
    }).toThrow();
  });

  it('should show help message when using -h option', () => {
    // Execute gme with -h option
    const output = executeScript(tmpDir.path, 'gme -h');

    // Verify help message is displayed
    expect(output).toContain('Usage: gme');
    expect(output).toContain('git merge');
  });
});
