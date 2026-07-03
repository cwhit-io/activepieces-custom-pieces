import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';

const webhookTypes = [
	'automatic-thumbnail-available',
	'content-scan-completed',
	'live-event-archive-available',
	'live-event-clip-created',
	'live-event-deleted',
	'live-event-ended',
	'live-event-started',
	'live-event-updated',
	'transcript-status-complete',
	'transcript-status-updated',
	'video-created',
	'video-deleted',
	'video-transcode-complete',
	'video-transcode-fully-playable',
	'video-transcode-playable',
	'video-updated',
	'video-upload-failed',
] as const;

export const createWebhook = createAction({
	auth: vimeoAuth,
	name: 'create_webhook',
	displayName: 'Create Webhook',
	description: 'Registers a webhook on your Vimeo developer app.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a webhook subscription on a Vimeo developer app for push notifications (e.g. video-created, video-transcode-playable). Not idempotent: duplicate subscriptions may be created if run repeatedly with the same URL.',
		idempotent: false,
	},
	props: {
		appId: Property.ShortText({
			displayName: 'App ID',
			description:
				'Numeric ID of your Vimeo developer app (from developer.vimeo.com/apps).',
			required: true,
		}),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description: 'Public HTTPS URL that receives webhook payloads.',
			required: true,
		}),
		webhookType: Property.StaticDropdown({
			displayName: 'Webhook Type',
			description: 'Vimeo event type that triggers the webhook.',
			required: true,
			options: {
				options: webhookTypes.map((type) => ({
					value: type,
					label: type,
				})),
			},
		}),
		isEnabled: Property.Checkbox({
			displayName: 'Enabled',
			description: 'Whether the webhook is active immediately.',
			required: false,
			defaultValue: true,
		}),
		secret: Property.ShortText({
			displayName: 'Secret',
			description:
				'Optional secret key included on webhook payloads for verification.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const appId = propsValue.appId.trim().replace(/\D/g, '');
		if (!appId) {
			throw new Error('App ID is required.');
		}

		const body: Record<string, string | boolean> = {
			webhook_url: propsValue.webhookUrl.trim(),
			webhook_type: propsValue.webhookType,
			is_enabled: propsValue.isEnabled ?? true,
		};

		if (propsValue.secret?.trim()) {
			body['secret'] = propsValue.secret.trim();
		}

		const response = await apiRequest({
			auth,
			path: `/apps/${appId}/webhooks`,
			method: HttpMethod.POST,
			body,
		});

		return response.body;
	},
});