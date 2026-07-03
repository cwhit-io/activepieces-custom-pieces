#!/usr/bin/env node
/**
 * Append a dated note to CHANGELOG.md.
 * Bump package.json separately per VERSION_POLICY.md, then rebuild (DB sync is automatic).
 *
 *   node packages/pieces/custom/scripts/log-custom-piece-change.mjs "vimeo-custom: video ID field"
 */

import { appendFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const changelogPath = join(__dirname, '..', 'CHANGELOG.md');

const message = process.argv.slice(2).join(' ').trim();
if (!message) {
	console.error('Usage: log-custom-piece-change.mjs "<what changed>"');
	process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const existing = await readFile(changelogPath, 'utf8');
const sectionHeader = `## ${today}`;

let entry;
if (existing.includes(sectionHeader)) {
	entry = `\n- ${message}\n`;
} else {
	entry = `\n${sectionHeader}\n\n- ${message}\n`;
}

await appendFile(changelogPath, entry);
console.log(`Logged to CHANGELOG.md: ${message}`);