#!/usr/bin/env node

const { Command } = require('commander');
const { executeGitCommand, unescapeQuotes, escapeQuotes } = require('./lib/git');

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
