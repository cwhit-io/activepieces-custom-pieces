import {
	createTrigger,
	PieceAuthProperty,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pcoCredentials } from './credentials';
import { PCO_WEBHOOK_EVENTS, PcoWebhookEventDefinition, PcoApp } from './events';
import { pcoWebhookParse, PcoWebhookTriggerOutput } from './parse';
import { pcoWebhookVerify } from './verify';
import { pcoWebhookClient } from './webhook-client';

function storeKey(triggerName: string): string {
	return `pco_webhook_${triggerName}`;
}

function createPcoWebhookTrigger<
	PieceAuth extends PieceAuthProperty | undefined,
>({
	auth,
	definition,
}: {
	auth: PieceAuth;
	definition: PcoWebhookEventDefinition;
}) {
	return createTrigger({
		auth,
		name: definition.name,
		displayName: definition.displayName,
		description: definition.description,
		aiMetadata: {
			description: definition.aiDescription,
		},
		props: {},
		type: TriggerStrategy.WEBHOOK,
		sampleData: definition.sampleData,
		async onEnable(context) {
			const credentials = pcoCredentials.parse(context.auth);
			if (!credentials) {
				throw new Error('Planning Center credentials are required.');
			}
			const subscription = await pcoWebhookClient.createSubscription({
				credentials,
				eventName: definition.eventName,
				webhookUrl: context.webhookUrl,
			});
			await context.store.put(storeKey(definition.name), {
				subscriptionId: subscription.subscriptionId,
				authenticitySecret: subscription.authenticitySecret,
			});
		},
		async onDisable(context) {
			const stored = await context.store.get<PcoWebhookStoreEntry>(
				storeKey(definition.name),
			);
			if (!stored?.subscriptionId) {
				return;
			}
			const credentials = pcoCredentials.parse(context.auth);
			if (!credentials) {
				return;
			}
			await pcoWebhookClient.deleteSubscription({
				credentials,
				subscriptionId: stored.subscriptionId,
			});
		},
		async run(context) {
			const stored = await context.store.get<PcoWebhookStoreEntry>(
				storeKey(definition.name),
			);
			if (!stored?.authenticitySecret) {
				return [];
			}
			const isValid = pcoWebhookVerify.verify({
				secret: stored.authenticitySecret,
				rawBody: context.payload.rawBody,
				headers: context.payload.headers,
			});
			if (!isValid) {
				return [];
			}
			const parsed = pcoWebhookParse.parseBody(context.payload.body);
			if (!parsed) {
				return [];
			}
			if (parsed.event_name !== definition.eventName) {
				return [];
			}
			return [parsed];
		},
		async test() {
			return [definition.sampleData];
		},
	});
}

function createTriggersForApp<PieceAuth extends PieceAuthProperty | undefined>({
	auth,
	app,
}: {
	auth: PieceAuth;
	app: PcoApp;
}) {
	return PCO_WEBHOOK_EVENTS.filter((event) => event.app === app).map(
		(definition) => createPcoWebhookTrigger({ auth, definition }),
	);
}

export const pcoWebhookTriggers = {
	create: createPcoWebhookTrigger,
	createForApp: createTriggersForApp,
};

type PcoWebhookStoreEntry = {
	subscriptionId: string;
	authenticitySecret: string;
};

export type { PcoWebhookTriggerOutput };