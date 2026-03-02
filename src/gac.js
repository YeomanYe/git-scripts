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

// Unescape quotes from command line input: \" → ", \' → '
function unescapeQuotes(message) {
  return message.replace(/\\"/g, '"').replace(/\\'/g, "'");
}

// Escape quotes for shell command: " → \"
function escapeQuotes(message) {
  return message.replace(/"/g, '\\"');
}

// Create commander instance
const program = new Command();

// Configure program
program
  .name('gac')
  .description('Quickly add all changes and commit with the provided message')
  .version('1.0.0')
  .usage('[options] <commit-message>')
  .argument('<commit-message>', 'Commit message for the git commit')
  .option('-n, --no-verify', 'Skip commit hooks (equivalent to git commit -n)')
  .addHelpText('after', `\nExamples:\n  $ gac "feat: add new feature"\n  $ gac "fix: resolve bug"\n  $ gac -n "feat: add new feature"`)
  .action((message, options) => {
    // Commander --no-verify generates options.verify (false when -n is passed)
    const noVerifyFlag = options.verify === false ? '-n' : '';
    // Unescape input: \" → ", \' → '
    const unescapedMessage = unescapeQuotes(message);
    // Escape for shell: " → \"
    const escapedMessage = escapeQuotes(unescapedMessage);
    executeGitCommand('git add .');
    executeGitCommand(`git commit ${noVerifyFlag} -m "${escapedMessage}"`);
  });

// Parse arguments
program.parse(process.argv);
