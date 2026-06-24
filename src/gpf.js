#!/usr/bin/env node

const { Command } = require('commander');
const { executeGitCommand, unescapeQuotes, escapeQuotes } = require('./lib/git');

// Create commander instance
const program = new Command();

// Configure program
program
  .name('gpf')
  .description('Quickly add all changes, commit with the provided message, and force push')
  .version('1.0.0')
  .usage('[commit-message]')
  .argument('<commit-message>', 'Commit message for the git commit')
  .addHelpText('after', `\nExamples:\n  $ gpf "feat: add new feature"\n  $ gpf "fix: resolve bug"`)
  .action((message) => {
    // Unescape input (\" → "), then escape for shell (" → \")
    const escapedMessage = escapeQuotes(unescapeQuotes(message));
    executeGitCommand('git add .');
    executeGitCommand(`git commit -m "${escapedMessage}"`);
    executeGitCommand('git push -f');
  });

// Parse arguments
program.parse(process.argv);
