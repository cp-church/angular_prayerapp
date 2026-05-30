#!/usr/bin/env node
/**
 * Shared fingerprint + stamp helpers for pre-handoff and the Cursor stop hook.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const STAMP_PATH = path.join(REPO_ROOT, '.pre-handoff-stamp');
const WATCH_PATHS = ['src/app', 'src/lib', 'supabase/migrations'];

function getWorktreeFingerprint() {
  try {
    const out = execSync(`git status --porcelain -- ${WATCH_PATHS.join(' ')}`, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    });
    return crypto.createHash('sha256').update(out.trim()).digest('hex');
  } catch {
    return null;
  }
}

function readStamp() {
  try {
    const raw = fs.readFileSync(STAMP_PATH, 'utf8').trim();
    const [fingerprint, at] = raw.split('\n');
    if (!fingerprint) {
      return null;
    }
    return { fingerprint, at: at ? Number(at) : 0 };
  } catch {
    return null;
  }
}

function writeStamp(fingerprint) {
  fs.mkdirSync(path.dirname(STAMP_PATH), { recursive: true });
  fs.writeFileSync(STAMP_PATH, `${fingerprint}\n${Date.now()}\n`, 'utf8');
}

function stampMatchesWorktree() {
  const current = getWorktreeFingerprint();
  if (current === null) {
    return true;
  }
  if (!current || current === crypto.createHash('sha256').update('').digest('hex')) {
    return true;
  }
  const stamp = readStamp();
  return stamp?.fingerprint === current;
}

module.exports = {
  REPO_ROOT,
  STAMP_PATH,
  WATCH_PATHS,
  getWorktreeFingerprint,
  readStamp,
  writeStamp,
  stampMatchesWorktree,
};
