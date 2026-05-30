#!/usr/bin/env node
/**
 * Cursor stop hook: when src/lib/migrations changed, require a recent `npm run pre-handoff`.
 * Writes followup_message so the agent runs pre-handoff before ending the turn.
 */
const {
  getWorktreeFingerprint,
  stampMatchesWorktree,
  WATCH_PATHS,
} = require('../../scripts/pre-handoff-utils');

const crypto = require('crypto');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

function emptyFingerprint(fp) {
  return fp === crypto.createHash('sha256').update('').digest('hex');
}

async function main() {
  const raw = await readStdin();
  let event = {};
  try {
    event = raw ? JSON.parse(raw) : {};
  } catch {
    process.stdout.write('{}\n');
    return;
  }

  if (event.status !== 'completed') {
    process.stdout.write('{}\n');
    return;
  }

  const fingerprint = getWorktreeFingerprint();
  if (fingerprint === null || emptyFingerprint(fingerprint)) {
    process.stdout.write('{}\n');
    return;
  }

  if (stampMatchesWorktree()) {
    process.stdout.write('{}\n');
    return;
  }

  const loopCount = typeof event.loop_count === 'number' ? event.loop_count : 0;
  const paths = WATCH_PATHS.join(', ');

  const message =
    loopCount >= 2
      ? `Pre-handoff is still required (${paths} changed; stamp missing or stale). Run \`npm run pre-handoff\` and fix failures. If it already passed, re-run it once. Then ReadLints on touched files and complete the logic review in .cursor/rules/verify-before-done.mdc before finishing.`
      : `Before finishing: run \`npm run pre-handoff\` in the repo root (lint + typecheck + unit tests). Fix any failures, then ReadLints on touched files and complete the logic review in .cursor/rules/verify-before-done.mdc. The stop hook will not release until pre-handoff has passed for the current code changes under ${paths}.`;

  process.stdout.write(
    `${JSON.stringify({ followup_message: message })}\n`
  );
}

main().catch(() => {
  process.stdout.write('{}\n');
});
