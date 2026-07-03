#!/usr/bin/env node
/**
 * Sync flow_version steps to package.json versions for all custom pieces.
 * Run after every version bump (also invoked by docker/build-custom-pieces.sh).
 * Uses docker exec psql (no pg npm dependency).
 *
 *   node packages/pieces/custom/scripts/reset-flow-piece-versions.cjs
 *   node packages/pieces/custom/scripts/reset-flow-piece-versions.cjs --dry-run
 *
 * See packages/pieces/custom/VERSION_POLICY.md
 */

const { readdir, readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const customRoot = join(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const postgresContainer = process.env.POSTGRES_CONTAINER ?? 'postgres';
const dbName = process.env.AP_POSTGRES_DATABASE ?? 'activepieces';
const dbUser = process.env.AP_POSTGRES_USERNAME ?? 'postgres';

const PIECE_ACTION_TYPES = new Set(['PIECE', 'PIECE_TRIGGER']);

function psqlJson(query) {
	const output = execFileSync(
		'docker',
		[
			'exec',
			postgresContainer,
			'psql',
			'-U',
			dbUser,
			'-d',
			dbName,
			'-t',
			'-A',
			'-c',
			query,
		],
		{ encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
	);
	return output.trim();
}

async function loadPinnedVersions() {
	const entries = await readdir(customRoot, { withFileTypes: true });
	const versions = {};

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}
		const packagePath = join(customRoot, entry.name, 'package.json');
		try {
			const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
			if (pkg.name && pkg.version) {
				versions[pkg.name] = pkg.version;
			}
		} catch {
			// skip
		}
	}

	return versions;
}

function updateStepTree(step, pinnedVersions, changes) {
	if (!step || typeof step !== 'object') {
		return;
	}

	const settings = step.settings;
	if (
		settings &&
		typeof settings.pieceName === 'string' &&
		PIECE_ACTION_TYPES.has(step.type) &&
		pinnedVersions[settings.pieceName]
	) {
		const targetVersion = pinnedVersions[settings.pieceName];
		if (settings.pieceVersion !== targetVersion) {
			changes.push({
				step: step.name ?? '(unnamed)',
				pieceName: settings.pieceName,
				from: settings.pieceVersion,
				to: targetVersion,
			});
			settings.pieceVersion = targetVersion;
		}
	}

	if (step.nextAction) {
		updateStepTree(step.nextAction, pinnedVersions, changes);
	}
	if (step.firstLoopAction) {
		updateStepTree(step.firstLoopAction, pinnedVersions, changes);
	}
	if (Array.isArray(step.children)) {
		for (const child of step.children) {
			if (child) {
				updateStepTree(child, pinnedVersions, changes);
			}
		}
	}
	const branches = step.continueOnFailureBranches;
	if (branches?.onSuccess) {
		updateStepTree(branches.onSuccess, pinnedVersions, changes);
	}
	if (branches?.onFailure) {
		updateStepTree(branches.onFailure, pinnedVersions, changes);
	}
}

function escapeSqlString(value) {
	return value.replace(/'/g, "''");
}

async function main() {
	const pinnedVersions = await loadPinnedVersions();
	console.log('Pinned custom piece versions:');
	for (const [name, version] of Object.entries(pinnedVersions).sort()) {
		console.log(`  ${name} → ${version}`);
	}

	const raw = psqlJson(
		`SELECT json_agg(json_build_object('id', id, 'flowId', "flowId", 'trigger', trigger)) FROM flow_version WHERE trigger IS NOT NULL`,
	);

	if (!raw || raw === '' || raw === 'null') {
		console.log('No flow versions found.');
		return;
	}

	const rows = JSON.parse(raw);
	let flowVersionsUpdated = 0;
	const allChanges = [];

	for (const row of rows) {
		const trigger = row.trigger;
		if (!trigger) {
			continue;
		}

		const changes = [];
		updateStepTree(trigger, pinnedVersions, changes);

		if (changes.length === 0) {
			continue;
		}

		allChanges.push({
			flowVersionId: row.id,
			flowId: row.flowId,
			changes,
		});

		if (!dryRun) {
			const triggerJson = escapeSqlString(JSON.stringify(trigger));
			psqlJson(
				`UPDATE flow_version SET trigger = '${triggerJson}'::jsonb, updated = NOW() WHERE id = '${escapeSqlString(row.id)}'`,
			);
		}
		flowVersionsUpdated += 1;
	}

	console.log('');
	if (dryRun) {
		console.log(`[dry-run] Would update ${flowVersionsUpdated} flow version(s):`);
	} else {
		console.log(`Updated ${flowVersionsUpdated} flow version(s):`);
	}

	for (const { flowVersionId, flowId, changes } of allChanges) {
		console.log(`  flow_version ${flowVersionId} (flow ${flowId}):`);
		for (const change of changes) {
			console.log(
				`    ${change.step}: ${change.pieceName} ${change.from} → ${change.to}`,
			);
		}
	}

	if (allChanges.length === 0) {
		console.log('No flow steps needed updating.');
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});