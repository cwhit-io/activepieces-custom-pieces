import * as net from 'node:net';

type CompanionConnection = {
	host: string;
	port: string;
	satellitePort: string;
};

type SatelliteMessage = {
	command: string;
	status: string | null;
	args: Record<string, string>;
};

type CompanionButtonInfo = {
	page: number;
	row: number;
	column: number;
	text: string | null;
	type: string | null;
};

function normalizeHost(host: string): string {
	return host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function parseSatelliteArgs(argsPart: string): Record<string, string> {
	const result: Record<string, string> = {};
	let index = 0;

	while (index < argsPart.length) {
		while (index < argsPart.length && argsPart[index] === ' ') {
			index += 1;
		}
		if (index >= argsPart.length) {
			break;
		}

		const equalsIndex = argsPart.indexOf('=', index);
		if (equalsIndex === -1) {
			break;
		}

		const key = argsPart.slice(index, equalsIndex);
		index = equalsIndex + 1;

		if (argsPart[index] === '"') {
			index += 1;
			let end = index;
			while (end < argsPart.length) {
				if (argsPart[end] === '"' && argsPart[end - 1] !== '\\') {
					break;
				}
				end += 1;
			}
			result[key] = argsPart.slice(index, end);
			index = end + 1;
			continue;
		}

		let end = index;
		while (end < argsPart.length && argsPart[end] !== ' ') {
			end += 1;
		}
		result[key] = argsPart.slice(index, end);
		index = end;
	}

	return result;
}

function parseSatelliteLine(line: string): SatelliteMessage | null {
	const trimmed = line.trim();
	if (trimmed.length === 0) {
		return null;
	}

	const spaceIndex = trimmed.indexOf(' ');
	if (spaceIndex === -1) {
		return { command: trimmed, status: null, args: {} };
	}

	const command = trimmed.slice(0, spaceIndex);
	let rest = trimmed.slice(spaceIndex + 1).trim();
	let status: string | null = null;

	if (rest === 'OK' || rest.startsWith('OK ')) {
		status = 'OK';
		rest = rest === 'OK' ? '' : rest.slice(3).trim();
	} else if (rest.startsWith('ERROR ')) {
		status = 'ERROR';
		rest = rest.slice(6).trim();
	}

	return {
		command,
		status,
		args: parseSatelliteArgs(rest),
	};
}

function decodeSatelliteText(value: string | undefined): string | null {
	if (!value) {
		return null;
	}
	try {
		const decoded = Buffer.from(value, 'base64').toString('utf8').trim();
		return decoded.length > 0 ? decoded : null;
	} catch {
		return null;
	}
}

function isPopulatedButton({
	type,
	text,
}: {
	type: string | null;
	text: string | null;
}): boolean {
	if (text) {
		return true;
	}
	return type === 'PAGEUP' || type === 'PAGEDOWN' || type === 'PAGENUM';
}

class SatelliteSession {
	private readonly socket: net.Socket;
	private buffer = '';
	private readonly waiters: Array<{
		predicate: (message: SatelliteMessage) => boolean;
		resolve: (message: SatelliteMessage) => void;
		reject: (error: Error) => void;
		timer: NodeJS.Timeout;
	}> = [];

	constructor(socket: net.Socket) {
		this.socket = socket;
		this.socket.on('data', (chunk) => {
			this.buffer += chunk.toString('utf8');
			this.drainBuffer();
		});
	}

	close(): void {
		for (const waiter of this.waiters) {
			clearTimeout(waiter.timer);
			waiter.reject(new Error('Satellite connection closed.'));
		}
		this.waiters.length = 0;
		this.socket.destroy();
	}

	send(command: string): void {
		this.socket.write(`${command}\n`);
	}

	waitFor({
		predicate,
		timeoutMs,
	}: {
		predicate: (message: SatelliteMessage) => boolean;
		timeoutMs: number;
	}): Promise<SatelliteMessage> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				const index = this.waiters.findIndex((waiter) => waiter.resolve === resolve);
				if (index >= 0) {
					this.waiters.splice(index, 1);
				}
				reject(new Error('Timed out waiting for a Satellite API response.'));
			}, timeoutMs);

			this.waiters.push({
				predicate,
				resolve,
				reject,
				timer,
			});
		});
	}

	private drainBuffer(): void {
		while (true) {
			const newlineIndex = this.buffer.indexOf('\n');
			if (newlineIndex === -1) {
				return;
			}

			const line = this.buffer.slice(0, newlineIndex);
			this.buffer = this.buffer.slice(newlineIndex + 1);
			const message = parseSatelliteLine(line);
			if (!message) {
				continue;
			}

			if (message.command === 'PING') {
				const payload = message.args['payload'] ?? '';
				this.send(`PONG ${payload}`.trim());
				continue;
			}

			const matchedIndex = this.waiters.findIndex((waiter) =>
				waiter.predicate(message),
			);
			if (matchedIndex === -1) {
				continue;
			}

			const [waiter] = this.waiters.splice(matchedIndex, 1);
			clearTimeout(waiter.timer);
			waiter.resolve(message);
		}
	}
}

async function openSatelliteSession({
	connection,
	timeoutMs,
}: {
	connection: CompanionConnection;
	timeoutMs: number;
}): Promise<SatelliteSession> {
	const host = normalizeHost(connection.host);
	const port = Number(connection.satellitePort);

	return await new Promise((resolve, reject) => {
		const socket = new net.Socket();
		const timer = setTimeout(() => {
			socket.destroy();
			reject(
				new Error(
					`Timed out connecting to Companion Satellite API on port ${connection.satellitePort}.`,
				),
			);
		}, timeoutMs);

		socket.once('error', (error) => {
			clearTimeout(timer);
			reject(error);
		});

		socket.connect(port, host, () => {
			clearTimeout(timer);
			const session = new SatelliteSession(socket);
			session
				.waitFor({
					predicate: (message) => message.command === 'BEGIN',
					timeoutMs,
				})
				.then(() => resolve(session))
				.catch((error) => {
					session.close();
					reject(error);
				});
		});
	});
}

async function subscribeToLocation({
	session,
	subId,
	location,
}: {
	session: SatelliteSession;
	subId: string;
	location: string;
}): Promise<CompanionButtonInfo | null> {
	session.send(`ADD-SUB SUBID=${subId} LOCATION=${location} TEXT=true`);

	const addResponse = await session.waitFor({
		predicate: (message) => message.command === 'ADD-SUB',
		timeoutMs: 3000,
	});

	if (addResponse.status === 'ERROR') {
		throw new Error(
			addResponse.args['MESSAGE'] ??
				'Companion rejected a Satellite button subscription. Enable Satellite button subscriptions in Companion settings.',
		);
	}

	const stateMessage = await session.waitFor({
		predicate: (message) =>
			message.command === 'SUB-STATE' && message.args['SUBID'] === subId,
		timeoutMs: 3000,
	});

	session.send(`REMOVE-SUB SUBID=${subId}`);
	await session.waitFor({
		predicate: (message) => message.command === 'REMOVE-SUB',
		timeoutMs: 3000,
	});

	const [pageValue, rowValue, columnValue] = location.split('/');
	const page = Number(pageValue);
	const row = Number(rowValue);
	const column = Number(columnValue);
	const text = decodeSatelliteText(stateMessage.args['TEXT']);
	const type = stateMessage.args['TYPE'] ?? null;

	if (!isPopulatedButton({ type, text })) {
		return null;
	}

	return {
		page,
		row,
		column,
		text,
		type,
	};
}

async function listButtonsOnPage({
	connection,
	page,
	maxRow = 31,
	maxColumn = 31,
}: {
	connection: CompanionConnection;
	page: number;
	maxRow?: number;
	maxColumn?: number;
}): Promise<CompanionButtonInfo[]> {
	const session = await openSatelliteSession({
		connection,
		timeoutMs: 5000,
	});

	try {
		const buttons: CompanionButtonInfo[] = [];

		for (let row = 0; row <= maxRow; row += 1) {
			for (let column = 0; column <= maxColumn; column += 1) {
				const subId = `scan-${page}-${row}-${column}`;
				const location = `${page}/${row}/${column}`;
				const button = await subscribeToLocation({
					session,
					subId,
					location,
				});
				if (button) {
					buttons.push(button);
				}
			}
		}

		return buttons.sort((left, right) => {
			if (left.row !== right.row) {
				return left.row - right.row;
			}
			return left.column - right.column;
		});
	} finally {
		session.send('QUIT');
		session.close();
	}
}

async function discoverActivePages({
	connection,
	maxPage = 20,
	maxRow = 7,
	maxColumn = 7,
}: {
	connection: CompanionConnection;
	maxPage?: number;
	maxRow?: number;
	maxColumn?: number;
}): Promise<Array<{ page: number; buttonCount: number }>> {
	const pages: Array<{ page: number; buttonCount: number }> = [];

	for (let page = 1; page <= maxPage; page += 1) {
		const buttons = await listButtonsOnPage({
			connection,
			page,
			maxRow,
			maxColumn,
		});
		if (buttons.length > 0) {
			pages.push({ page, buttonCount: buttons.length });
		}
	}

	return pages;
}

export const companionSatellite = {
	listButtonsOnPage,
	discoverActivePages,
};

export type { CompanionButtonInfo, CompanionConnection };