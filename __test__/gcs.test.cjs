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

describe('gcs', () => {
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
  
  it('should stash the latest commit', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');
    
    // Create a unique bare repo as remote for each test
    const bareRepo = `${tmpDir.path}/bare-repo`;
    executeGitCommand(tmpDir.path, `git init --bare ${bareRepo}`);
    executeGitCommand(tmpDir.path, `git remote add origin ${bareRepo}`);
    executeGitCommand(tmpDir.path, 'git push -u origin master');
    
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
  
  it('should show help message when using -h option', () => {
    // Execute gcs with -h option
    const output = executeScript(tmpDir.path, 'gcs -h');
    
    // Verify help message is displayed
    expect(output).toContain('Usage: gcs');
    expect(output).toContain('Stash local commits step by step, useful for reordering or modifying commits');
  });

  it('should stash all commits ahead of remote when using -a option', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');

    // Create a unique bare repo as remote for each test
    const bareRepo = `${tmpDir.path}/bare-repo`;
    executeGitCommand(tmpDir.path, `git init --bare ${bareRepo}`);
    executeGitCommand(tmpDir.path, `git remote add origin ${bareRepo}`);
    executeGitCommand(tmpDir.path, 'git push -u origin master');

    // Create multiple new commits
    const commitMessages = ['commit 1', 'commit 2', 'commit 3'];
    for (const msg of commitMessages) {
      const newFile = path.join(tmpDir.path, `${msg.replace(/\s+/g, '-')}.txt`);
      fs.writeFileSync(newFile, msg);
      executeGitCommand(tmpDir.path, 'git add .');
      executeGitCommand(tmpDir.path, `git commit -m "${msg}"`);
    }

    // Execute gcs -a command
    executeScript(tmpDir.path, 'gcs -a');

    // Verify all commits were stashed
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    for (const msg of commitMessages) {
      expect(stashList).toContain(msg);
    }

    // Verify current branch is at the same commit as remote
    const localCommit = executeGitCommand(tmpDir.path, 'git rev-parse HEAD').trim();
    const remoteCommit = executeGitCommand(tmpDir.path, 'git rev-parse origin/master').trim();
    expect(localCommit).toBe(remoteCommit);
  });

  it('normal: should stash commit with tab character', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');

    // Create a unique bare repo as remote
    const bareRepo = `${tmpDir.path}/bare-repo`;
    executeGitCommand(tmpDir.path, `git init --bare ${bareRepo}`);
    executeGitCommand(tmpDir.path, `git remote add origin ${bareRepo}`);
    executeGitCommand(tmpDir.path, 'git push -u origin master');

    // Create a commit with tab in message
    const newFile = path.join(tmpDir.path, 'new.txt');
    fs.writeFileSync(newFile, 'new content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "feat:\tadd feature"');

    // Execute gcs command
    executeScript(tmpDir.path, 'gcs');

    // Verify the stash contains encoded tab
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList).toContain('::TAB::');
  });

  it('edge: should escape existing markers to prevent conflicts', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');

    // Create a unique bare repo as remote
    const bareRepo = `${tmpDir.path}/bare-repo`;
    executeGitCommand(tmpDir.path, `git init --bare ${bareRepo}`);
    executeGitCommand(tmpDir.path, `git remote add origin ${bareRepo}`);
    executeGitCommand(tmpDir.path, 'git push -u origin master');

    // Create a commit with marker-like text in message
    const newFile = path.join(tmpDir.path, 'new.txt');
    fs.writeFileSync(newFile, 'new content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "feat: test ::NL:: marker"');

    // Execute gcs command
    executeScript(tmpDir.path, 'gcs');

    // Verify existing marker is escaped
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList).toContain('::::NL::::');
  });

  it('normal: should preserve backslash-n as literal characters', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');

    // Create a unique bare repo as remote
    const bareRepo = `${tmpDir.path}/bare-repo`;
    executeGitCommand(tmpDir.path, `git init --bare ${bareRepo}`);
    executeGitCommand(tmpDir.path, `git remote add origin ${bareRepo}`);
    executeGitCommand(tmpDir.path, 'git push -u origin master');

    // Create a commit with literal \n in message (backslash followed by n)
    const newFile = path.join(tmpDir.path, 'new.txt');
    fs.writeFileSync(newFile, 'new content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "feat: test \\\\n in message"');

    // Execute gcs command
    executeScript(tmpDir.path, 'gcs');

    // Verify the stash contains the message
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList).toContain('test \\n in message');
  });

  it('normal: should stash commit with multiline message', () => {
    // Create initial commit
    const initialFile = path.join(tmpDir.path, 'initial.txt');
    fs.writeFileSync(initialFile, 'initial content');
    executeGitCommand(tmpDir.path, 'git add .');
    executeGitCommand(tmpDir.path, 'git commit -m "initial commit"');

    // Create a unique bare repo as remote
    const bareRepo = `${tmpDir.path}/bare-repo`;
    executeGitCommand(tmpDir.path, `git init --bare ${bareRepo}`);
    executeGitCommand(tmpDir.path, `git remote add origin ${bareRepo}`);
    executeGitCommand(tmpDir.path, 'git push -u origin master');

    // Create a commit with multiline message
    const newFile = path.join(tmpDir.path, 'new.txt');
    fs.writeFileSync(newFile, 'new content');
    executeGitCommand(tmpDir.path, 'git add .');
    // Use actual newline characters in commit message
    executeGitCommand(tmpDir.path, 'git commit -m "feat: add feature\n\nThis is the body"');

    // Execute gcs command - should preserve newlines as ::NL:: in stash
    executeScript(tmpDir.path, 'gcs');

    // Verify the stash contains encoded newlines
    const stashList = executeGitCommand(tmpDir.path, 'git stash list');
    expect(stashList).toContain('::NL::');
  });
});
