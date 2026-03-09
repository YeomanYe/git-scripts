#!/usr/bin/env node

const { Command } = require('commander');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(message, color = '') {
  console.log(color + message + RESET);
}

function logSuccess(message) {
  log(`✓ ${message}`, GREEN);
}

function logError(message) {
  log(`✗ ${message}`, RED);
}

function logWarning(message) {
  log(`⚠ ${message}`, YELLOW);
}

function getGitScriptsCommands() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return Object.keys(packageJson.bin || {});
}

function getSystemGitCommands() {
  try {
    const output = execSync('git help -a', { encoding: 'utf-8' });
    const commands = [];

    const lines = output.split('\n');
    let inCommandsSection = false;

    for (const line of lines) {
      if (line.includes('available git commands') || line.includes('see')) {
        inCommandsSection = true;
        continue;
      }

      if (inCommandsSection && line.trim() === '') {
        break;
      }

      if (inCommandsSection) {
        const match = line.match(/^\s{2,}(\S+)/);
        if (match && match[1] && match[1] !== 'git') {
          commands.push(match[1]);
        }
      }
    }

    if (commands.length > 0) return commands;

    return extractFromGitCompletion();
  } catch (error) {
    logWarning('Failed to get git commands, using fallback method');
    return getGitCommandsBasic();
  }
}

function extractFromGitCompletion() {
  try {
    const output = execSync('git --list-cmds=main', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(cmd => cmd.length > 0);
  } catch {
    return [];
  }
}

function getGitCommandsBasic() {
  return [
    'add', 'am', 'archive', 'bisect', 'blame', 'branch', 'bundle',
    'checkout', 'cherry-pick', 'citool', 'clean', 'clone', 'commit',
    'config', 'credential', 'describe', 'diff', 'fetch', 'format-patch',
    'gc', 'grep', 'gui', 'init', 'log', 'ls-files', 'ls-tree', 'merge',
    'mv', 'notes', 'pull', 'push', 'rebase', 'reset', 'restore', 'rm',
    'shortlog', 'show', 'sparse-checkout', 'stash', 'status', 'submodule',
    'switch', 'tag', 'worktree'
  ];
}

function checkCommandAvailable(command) {
  try {
    const result = execSync(`${command} --version`, { encoding: 'utf-8', timeout: 5000 });
    return { available: true, version: result.trim() };
  } catch {
    return { available: false, version: null };
  }
}

function checkCommandPath(command) {
  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    const output = execSync(`${which} ${command}`, { encoding: 'utf-8' });
    const paths = output.trim().split('\n');
    return { path: paths[0], allPaths: paths };
  } catch {
    return { path: null, allPaths: [] };
  }
}

function analyze(options) {
  const { quiet, conflictsOnly } = options;

  if (!quiet) {
    log(`${BOLD}Git Scripts Command Detection${RESET}\n`);
    log(`Platform: ${process.platform}`, BLUE);
    log(`Node.js: ${process.version}\n`);
  }

  const gitScriptsCommands = getGitScriptsCommands();
  const systemGitCommands = getSystemGitCommands();

  if (!quiet) {
    log(`${BOLD}1. Git-Scripts Commands:${RESET}`, BOLD);
  }
  const commandResults = [];

  for (const cmd of gitScriptsCommands) {
    const versionResult = checkCommandAvailable(cmd);
    const pathResult = checkCommandPath(cmd);
    const conflict = systemGitCommands.includes(cmd);

    commandResults.push({
      command: cmd,
      ...versionResult,
      ...pathResult,
      conflict
    });
  }

  const available = commandResults.filter(r => r.available);
  const unavailable = commandResults.filter(r => !r.available);

  if (!quiet) {
    log(`\n${GREEN}Registered (${available.length}):${RESET}`);
    for (const result of available) {
      logSuccess(`${result.command}`);
    }

    if (unavailable.length > 0) {
      log(`\n${RED}Not Registered (${unavailable.length}):${RESET}`);
      for (const result of unavailable) {
        logError(`${result.command}`);
      }
    }

    log(`\n${BOLD}2. System Git Commands Check:${RESET}`, BOLD);
    log(`Found ${systemGitCommands.length} git commands in system\n`);
  }

  if (!quiet) {
    log(`${BOLD}3. Conflict Analysis:${RESET}`, BOLD);
  }

  const conflicts = commandResults.filter(r => r.conflict);

  if (conflicts.length > 0) {
    if (!quiet) {
      log(`\n${YELLOW}Potential Conflicts (${conflicts.length}):${RESET}`);
      for (const result of conflicts) {
        logWarning(`${result.command} - conflicts with 'git ${result.command}'`);
        if (result.available && result.path) {
          log(`  → Executable: ${result.path}`, BLUE);
        }
      }
    }
  } else if (!quiet) {
    log(`\n${GREEN}No conflicts with system git commands!${RESET}`);
  }

  if (!quiet && !conflictsOnly) {
    log(`\n${BOLD}4. Detailed Status:${RESET}`, BOLD);

    const tableData = commandResults.map(r => ({
      command: r.command,
      status: r.available ? '✓' : '✗',
      conflict: r.conflict ? '⚠' : '✓',
      path: r.path ? path.basename(r.path) : '-'
    }));

    const colWidths = {
      command: Math.max(6, ...tableData.map(d => d.command.length)),
      status: 8,
      conflict: 10,
      path: Math.max(15, ...tableData.map(d => d.path.length))
    };

    const header = `${'Command'.padEnd(colWidths.command)} ${'Status'.padEnd(colWidths.status)} ${'Conflict'.padEnd(colWidths.conflict)} Path`;
    log(header, BOLD);
    log('-'.repeat(header.length), BLUE);

    for (const row of tableData) {
      let color = GREEN;
      const isAvailable = row.status === '✓';
      const hasConflict = row.conflict === '⚠';
      if (!isAvailable) color = RED;
      else if (hasConflict) color = YELLOW;
      const line = `${row.command.padEnd(colWidths.command)} ${row.status.padEnd(colWidths.status)} ${row.conflict.padEnd(colWidths.conflict)} ${row.path}`;
      log(line, color);
    }
  }

  log('');
  log(`${BOLD}Summary:${RESET}`, BOLD);
  log(`Total commands: ${commandResults.length}`, BLUE);
  log(`Registered: ${GREEN}${available.length}${RESET}`, BLUE);
  log(`Not registered: ${RED}${unavailable.length}${RESET}`, BLUE);
  log(`Conflicts: ${conflicts.length > 0 ? YELLOW : GREEN}${conflicts.length}${RESET}`, BLUE);

  return {
    total: commandResults.length,
    available: available.length,
    unavailable: unavailable.length,
    conflicts: conflicts.length,
    results: commandResults
  };
}

const program = new Command();

program
  .name('check-commands')
  .description('Check if git-scripts commands are registered and detect conflicts with system git commands')
  .version('1.0.0')
  .option('-q, --quiet', 'Output only summary', false)
  .option('-c, --conflicts-only', 'Show only conflicts', false)
  .action((options) => {
    try {
      const result = analyze(options);
      process.exit(result.unavailable > 0 ? 1 : 0);
    } catch (error) {
      logError(`Analysis failed: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
