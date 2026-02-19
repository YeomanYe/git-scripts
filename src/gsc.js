#!/usr/bin/env node

const { execSync } = require('child_process');
const { Command } = require('commander');

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

// Decode markers back to special characters
// - First unescape existing markers: ::::X:::: → ::X::
// - Then decode: ::NL:: → \n, ::CR:: → \r, ::TAB:: → \t
function decodeMessage(message) {
  let decoded = message;
  // First unescape escaped markers
  decoded = decoded.replace(/::::([A-Z]+)::::/g, '::$1::');
  // Then decode special characters
  decoded = decoded.replace(/::NL::/g, '\n');
  decoded = decoded.replace(/::CR::/g, '\r');
  decoded = decoded.replace(/::TAB::/g, '\t');
  return decoded;
}

// Create commander instance
const program = new Command();

// Configure program
program
  .name('gsc')
  .description('Pop stash items and commit them with their original descriptions')
  .version('1.0.0')
  .usage('[options]')
  .option('-a, --all', 'Pop and commit all stash items')
  .addHelpText('after', `\nExamples:\n  $ gsc              Pop and commit the latest stash item\n  $ gsc -a           Pop and commit all stash items`)
  .action((options) => {
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

    if (options.all) {
      console.log('Popping stash items in order and committing each...');

      for (let i = 0; i < stashCount; i++) {
        // Get stash description
        const currentStashList = executeGitCommand('git stash list');
        const firstStashInfo = currentStashList.split('\n').filter(line => line.trim())[0];
        if (!firstStashInfo) break;

        const stashDescription = firstStashInfo.split(':').slice(2).join(':').trim().replace(/^On [^:]*: /, '');
        const decodedMessage = decodeMessage(stashDescription);

        console.log();
        console.log(`Popping stash item: stash@{0}`);
        executeGitCommand('git stash pop');

        executeGitCommand('git add .');
        console.log(`Committing with message: ${decodedMessage}`);
        executeGitCommand(`git commit -m "${decodedMessage}"`);

        console.log('Successfully committed stash item');
      }
    } else {
      console.log('Popping only the latest stash item...');

      // Get latest stash description
      const latestStashInfo = stashList.split('\n').filter(line => line.trim())[0];
      const latestStashDescription = latestStashInfo.split(':').slice(2).join(':').trim().replace(/^On [^:]*: /, '');
      const decodedMessage = decodeMessage(latestStashDescription);

      executeGitCommand('git stash pop');

      executeGitCommand('git add .');
      console.log(`Committing with message: ${decodedMessage}`);
      executeGitCommand(`git commit -m "${decodedMessage}"`);

      console.log('Successfully committed the latest stash item');
    }

    console.log();
    console.log('Stash commit operation completed successfully!');
    console.log('You can view the commits with \'git log\'');
  });

// Parse arguments
program.parse(process.argv);
