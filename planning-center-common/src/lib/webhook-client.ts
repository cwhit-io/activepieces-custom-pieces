import {
	AuthenticationType,
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';
import { PlanningCenterCredentials } from './credentials';

const WEBHOOKS_BASE_URL = 'https://api.planningcenteronline.com/webhooks/v2';
const USER_AGENT =
	'Activepieces Planning Center Webhooks (https://activepieces.com)';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function readStringField(
	record: Record<string, unknown>,
	fieldName: string,
): string | null {
	const value = record[fieldName];
	return typeof value === 'string' ? value : null;
}

function parseSubscriptionResponse(
	body: unknown,
): PcoWebhookSubscription | null {
	if (!isRecord(body) || !isRecord(body['data'])) {
		return null;
	}
	const data = body['data'];
	const id = readStringField(data, 'id');
	if (!id) {
		return null;
	}
	if (!isRecord(data['attributes'])) {
		return null;
	}
	const authenticitySecret = readStringField(
		data['attributes'],
		'authenticity_secret',
	);
	if (!authenticitySecret) {
		return null;
	}
	const eventName = readStringField(data['attributes'], 'name');
	return {
		subscriptionId: id,
		authenticitySecret,
		eventName,
	};
}

async function createSubscription({
	credentials,
	eventName,
	webhookUrl,
}: {
	credentials: PlanningCenterCredentials;
	eventName: string;
	webhookUrl: string;
}): Promise<PcoWebhookSubscription> {
	const response = await httpClient.sendRequest({
		method: HttpMethod.POST,
		url: `${WEBHOOKS_BASE_URL}/subscriptions`,
		authentication: {
			type: AuthenticationType.BASIC,
			username: credentials.applicationId,
			password: credentials.secret,
		},
		headers: {
			'User-Agent': USER_AGENT,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: {
			data: {
				type: 'Subscription',
				attributes: {
					name: eventName,
					url: webhookUrl,
					active: true,
				},
			},
		},
	});
	const subscription = parseSubscriptionResponse(response.body);
	if (!subscription) {
		throw new Error(
			'Failed to create Planning Center webhook subscription. Verify your PAT has webhook permissions and the event name is valid.',
		);
	}
	return subscription;
}

async function deleteSubscription({
	credentials,
	subscriptionId,
}: {
	credentials: PlanningCenterCredentials;
	subscriptionId: string;
}): Promise<void> {
	await httpClient.sendRequest({
		method: HttpMethod.DELETE,
		url: `${WEBHOOKS_BASE_URL}/subscriptions/${subscriptionId}`,
		authentication: {
			type: AuthenticationType.BASIC,
			username: credentials.applicationId,
			password: credentials.secret,
		},
		headers: {
			'User-Agent': USER_AGENT,
			Accept: 'application/json',
		},
	});
}

export const pcoWebhookClient = {
	createSubscription,
	deleteSubscription,
};

export type PcoWebhookSubscription = {
	subscriptionId: string;
	authenticitySecret: string;
	eventName: string | null;
};