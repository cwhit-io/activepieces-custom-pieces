import {
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpResponse,
} from '@activepieces/pieces-common';
import {
	companionSatellite,
	type CompanionButtonInfo,
	type CompanionConnection,
} from './satellite';

type HttpConnection = {
	host: string;
	port: string;
};

type CompanionConnectionStatus = {
	id: string;
	label: string;
	moduleId: string;
	enabled: boolean;
	status: unknown;
};

function normalizeHost(host: string): string {
	return host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function baseUrlFromConnection({ host, port }: HttpConnection): string {
	const normalizedHost = normalizeHost(host);
	const normalizedPort = port.trim();
	return `http://${normalizedHost}:${normalizedPort}`;
}

function connectionFromAuth({
	host,
	port,
	satellitePort,
}: {
	host: string;
	port: string;
	satellitePort?: string;
}): CompanionConnection {
	return {
		host,
		port,
		satellitePort: satellitePort?.trim() || '16622',
	};
}

async function sendLocationCommand({
	connection,
	page,
	row,
	column,
	command,
}: {
	connection: HttpConnection;
	page: number;
	row: number;
	column: number;
	command: 'down' | 'up' | 'press';
}): Promise<HttpResponse<HttpMessageBody>> {
	const baseUrl = baseUrlFromConnection(connection);

	return await httpClient.sendRequest({
		method: HttpMethod.POST,
		url: `${baseUrl}/api/location/${page}/${row}/${column}/${command}`,
	});
}

async function validateConnection({
	connection,
}: {
	connection: HttpConnection;
}): Promise<boolean> {
	const baseUrl = baseUrlFromConnection(connection);

	try {
		await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: baseUrl,
		});
		return true;
	} catch {
		return false;
	}
}

async function listConnections({
	connection,
}: {
	connection: HttpConnection;
}): Promise<CompanionConnectionStatus[]> {
	const baseUrl = baseUrlFromConnection(connection);
	const response = await httpClient.sendRequest<CompanionConnectionStatus[]>({
		method: HttpMethod.GET,
		url: `${baseUrl}/api/connections`,
	});
	return Array.isArray(response.body) ? response.body : [];
}

async function listButtonsOnPage({
	connection,
	page,
	maxRow,
	maxColumn,
}: {
	connection: CompanionConnection;
	page: number;
	maxRow?: number;
	maxColumn?: number;
}): Promise<CompanionButtonInfo[]> {
	return await companionSatellite.listButtonsOnPage({
		connection,
		page,
		maxRow,
		maxColumn,
	});
}

async function discoverActivePages({
	connection,
	maxPage,
	maxRow,
	maxColumn,
}: {
	connection: CompanionConnection;
	maxPage?: number;
	maxRow?: number;
	maxColumn?: number;
}): Promise<Array<{ page: number; buttonCount: number }>> {
	return await companionSatellite.discoverActivePages({
		connection,
		maxPage,
		maxRow,
		maxColumn,
	});
}

export const companionClient = {
	baseUrlFromConnection,
	connectionFromAuth,
	sendLocationCommand,
	validateConnection,
	listConnections,
	listButtonsOnPage,
	discoverActivePages,
};