#!/usr/bin/env node

const { execSync } = require('child_process');

// Helper function to execute git commands
function executeGitCommand(command) {
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(`Error details: ${error.message}`);
    process.exit(1);
  }
}

// Get arguments
const [, , ...args] = process.argv;
const all = args.includes('-a') || args.includes('--all');

// Check if there are stash items
let stashCount;
let stashList;
try {
  stashList = executeGitCommand('git stash list');
  stashCount = stashList.split('\n').filter(line => line.trim()).length;
} catch (error) {
  console.log('Info: No stash items available');
  process.exit(0);
}

if (stashCount === 0) {
  console.log('Info: No stash items available');
  process.exit(0);
}

if (all) {
  console.log('Popping stash items in order and committing each...');
  
  for (let i = 0; i < stashCount; i++) {
    // Get stash description
    const currentStashList = executeGitCommand('git stash list');
    const firstStashInfo = currentStashList.split('\n').filter(line => line.trim())[0];
    if (!firstStashInfo) break;
    
    const stashDescription = firstStashInfo.split(':').slice(2).join(':').trim().replace(/^On [^:]*: /, '');
    
    console.log();
    console.log(`Popping stash item: stash@{0}`);
    executeGitCommand('git stash pop');
    
    executeGitCommand('git add .');
    console.log(`Committing with message: ${stashDescription}`);
    executeGitCommand(`git commit -m "${stashDescription}"`);
    
    console.log('Successfully committed stash item');
  }
} else {
  console.log('Popping only the latest stash item...');
  
  // Get latest stash description
  const latestStashInfo = stashList.split('\n').filter(line => line.trim())[0];
  const latestStashDescription = latestStashInfo.split(':').slice(2).join(':').trim().replace(/^On [^:]*: /, '');
  
  executeGitCommand('git stash pop');
  
  executeGitCommand('git add .');
  console.log(`Committing with message: ${latestStashDescription}`);
  executeGitCommand(`git commit -m "${latestStashDescription}"`);
  
  console.log('Successfully committed the latest stash item');
}

console.log();
console.log('Stash commit operation completed successfully!');
console.log('You can view the commits with \'git log\'');
