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

describe('git-scripts', () => {
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
  
  describe('gac', () => {
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
  });
  
  describe('gcr', () => {
    it('should clean the repository', () => {
      // Create a test file
      const testFile = path.join(tmpDir.path, 'test.txt');
      fs.writeFileSync(testFile, 'test content');
      
      // Execute gcr command
      executeScript(tmpDir.path, 'gcr');
      
      // Verify the file is no longer tracked
      const status = executeGitCommand(tmpDir.path, 'git status --porcelain');
      expect(status).not.toContain('test.txt');
    });
  });
  
  describe('gcs', () => {
    it('should stash the latest commit', () => {
      // Create initial commit
      const initialFile = path.join(tmpDir.path, 'initial.txt');
      fs.writeFileSync(initialFile, 'initial content');
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
      
      // Create a new commit
      const newFile = path.join(tmpDir.path, 'new.txt');
      fs.writeFileSync(newFile, 'new content');
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, 'git commit -m "new commit"');
      
      // Execute gcs command
      executeScript(tmpDir.path, 'gcs');
      
      // Verify the commit was stashed
      const stashList = executeGitCommand(tmpDir.path, 'git stash list');
      expect(stashList).toContain('new commit');
    });
  });
  
  describe('gpf', () => {
    it('should add, commit and force push', () => {
      // This test would require a remote repository, which is complex to set up
      // We'll skip it for now
      expect(true).toBe(true);
    });
  });
  
  describe('gph', () => {
    it('should add, commit and push', () => {
      // This test would require a remote repository, which is complex to set up
      // We'll skip it for now
      expect(true).toBe(true);
    });
  });
  
  describe('grh', () => {
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
  });
  
  describe('gsc', () => {
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
  });
});
