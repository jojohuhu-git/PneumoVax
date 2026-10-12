// queue P1-4: the save-time guardrail that stops a stray note being saved at
// the top level printed a list of allowed filenames that did not match the
// list it actually enforces. It allowed four files and told the reader three.
//
// Being told the wrong rule by the thing enforcing the rule is the kind of
// quiet dishonesty this project treats as a defect, so the message is now
// built FROM the allowlist, and this test runs the real script to prove the
// two agree — including after someone edits the allowlist.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve(__dirname, '..', 'check-root-notes.sh');

// The names the script enforces, read out of the script itself — so this test
// follows an edit to the allowlist instead of pinning yesterday's four names.
function allowlist() {
  const src = readFileSync(SCRIPT, 'utf8');
  const m = src.match(/^allowed="([^"]*)"/m);
  expect(m, 'the script should declare allowed="..."').toBeTruthy();
  return m[1].trim().split(/\s+/);
}

// Run the guard in a throwaway repo with `staged` added, and report what a
// person would see.
function runGuard(staged) {
  const dir = mkdtempSync(join(tmpdir(), 'rootnotes-'));
  try {
    const git = args => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
    git(['init', '-q']);
    git(['config', 'user.email', 'test@example.com']);
    git(['config', 'user.name', 'test']);
    for (const name of staged) writeFileSync(join(dir, name), '# note\n');
    git(['add', ...staged]);
    try {
      const out = execFileSync('sh', [SCRIPT], { cwd: dir, encoding: 'utf8' });
      return { code: 0, out };
    } catch (e) {
      return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('queue P1-4 — the root-note guard states the rule it enforces', () => {
  it('blocks a stray top-level note', () => {
    const { code, out } = runGuard(['stray-note.md']);
    expect(code).toBe(1);
    expect(out).toMatch(/stray-note\.md/);
  });

  it('names every allowed file in the message it prints', () => {
    const { out } = runGuard(['stray-note.md']);
    for (const name of allowlist()) {
      expect(out, `the message should name ${name}, which it allows`).toContain(name);
    }
  });

  it('names no file it does not actually allow', () => {
    const { out } = runGuard(['stray-note.md']);
    // The sentence listing the permitted files, isolated from the rest.
    const sentence = out.split('\n').find(l => /belong at the top level/.test(l)) || '';
    const named = sentence.match(/[A-Z_]+\.md/g) || [];
    expect(named.length).toBeGreaterThan(0);
    for (const name of named) expect(allowlist()).toContain(name);
  });

  it('lets every allowed file through', () => {
    const { code } = runGuard(allowlist());
    expect(code).toBe(0);
  });

  // The tests above check that the message matches the allowlist, whatever the
  // allowlist says. This one pins the allowlist itself to the four files
  // CLAUDE.md's "Root Directory Hygiene" rule names, so the list cannot
  // quietly grow or shrink: CLINICAL_SPEC.md in particular has to stay,
  // because code and test comments cite it by that exact path.
  it('allows exactly the four files CLAUDE.md names at the root', () => {
    expect(allowlist().slice().sort()).toEqual(
      ['CLAUDE.md', 'CLINICAL_SPEC.md', 'MAP.md', 'README.md']
    );
  });
});
