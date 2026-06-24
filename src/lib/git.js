'use strict';

// Shared helpers for the git-scripts CLI commands.
// Pure functions (escape/unescape, encode/decode) are exported so they can be
// unit-tested directly without spawning a subprocess.

const { execSync } = require('child_process');

// Execute a git command, exiting the process on failure.
// `options` is merged into the execSync options (e.g. { cwd }).
function executeGitCommand(command, options = {}) {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(`Error details: ${error.message}`);
    process.exit(1);
  }
}

// Execute a git command that may fail; returns trimmed output or null.
function tryExecuteGitCommand(command, options = {}) {
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
    return output.trim();
  } catch (error) {
    return null;
  }
}

// Unescape quotes from command line input: \" -> ", \' -> '
function unescapeQuotes(message) {
  return message.replace(/\\"/g, '"').replace(/\\'/g, "'");
}

// Escape double quotes for a shell command: " -> \"
function escapeQuotes(message) {
  return message.replace(/"/g, '\\"');
}

// Encode special characters to markers for a stash message.
// - Escape existing markers first: ::X:: -> ::::X::::
// - Then encode: \n -> ::NL::, \r -> ::CR::, \t -> ::TAB::, " -> ::DQ::
function encodeMessage(message) {
  let encoded = message.replace(/::([A-Z]+)::/g, '::::$1::::');
  encoded = encoded.replace(/\n/g, '::NL::');
  encoded = encoded.replace(/\r/g, '::CR::');
  encoded = encoded.replace(/\t/g, '::TAB::');
  encoded = encoded.replace(/"/g, '::DQ::');
  return encoded;
}

// Decode markers back to special characters.
// - First unescape escaped markers: ::::X:::: -> ::X::
// - Then decode: ::NL:: -> \n, ::CR:: -> \r, ::TAB:: -> \t, ::DQ:: -> "
function decodeMessage(message) {
  let decoded = message;
  decoded = decoded.replace(/::::([A-Z]+)::::/g, '::$1::');
  decoded = decoded.replace(/::NL::/g, '\n');
  decoded = decoded.replace(/::CR::/g, '\r');
  decoded = decoded.replace(/::TAB::/g, '\t');
  decoded = decoded.replace(/::DQ::/g, '"');
  return decoded;
}

// Return the first non-empty line of multi-line command output.
// Cross-platform replacement for `... | head -1`.
function firstLine(output) {
  return output.split('\n').map(l => l.trim()).filter(Boolean)[0] || '';
}

// Return the last non-empty line of multi-line command output.
// Cross-platform replacement for `... | tail -1`.
function lastLine(output) {
  const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
  return lines[lines.length - 1] || '';
}

module.exports = {
  executeGitCommand,
  tryExecuteGitCommand,
  unescapeQuotes,
  escapeQuotes,
  encodeMessage,
  decodeMessage,
  firstLine,
  lastLine,
};
