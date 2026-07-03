import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { companionClient } from './common/client';

export const companionAuth = PieceAuth.CustomAuth({
	displayName: 'Companion Connection',
	description:
		'Enter the host and HTTP port where Bitfocus Companion is running (default 8000). Button label scanning uses the Satellite port (default 16622).',
	required: true,
	props: {
		host: Property.ShortText({
			displayName: 'Host',
			description:
				'IP address or hostname of the Companion instance (e.g. 192.168.1.50 or companion.local).',
			required: true,
		}),
		port: Property.ShortText({
			displayName: 'Port',
			description: 'HTTP port Companion listens on. Default is 8000.',
			required: true,
			defaultValue: '8000',
		}),
		satellite_port: Property.ShortText({
			displayName: 'Satellite Port',
			description:
				'TCP port for the Companion Satellite API used to scan button labels. Default is 16622. Enable HTTP API and Satellite button subscriptions in Companion settings.',
			required: false,
			defaultValue: '16622',
		}),
	},
	validate: async ({ auth }) => {
		if (!auth.host?.trim()) {
			return {
				valid: false,
				error: 'Host is required.',
			};
		}

		if (!auth.port?.trim()) {
			return {
				valid: false,
				error: 'Port is required.',
			};
		}

		const portNumber = Number(auth.port);
		if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
			return {
				valid: false,
				error: 'Port must be a whole number between 1 and 65535.',
			};
		}

		const isReachable = await companionClient.validateConnection({
			connection: {
				host: auth.host,
				port: auth.port,
			},
		});

		if (!isReachable) {
			return {
				valid: false,
				error:
					'Could not reach Companion at that host and port. Verify Companion is running and the address is correct.',
			};
		}

		return { valid: true };
	},
});