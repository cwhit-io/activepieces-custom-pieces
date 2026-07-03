import { JsonApiResource, pcoFlatten } from './flatten';

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

function parseJsonApiResource(value: unknown): JsonApiResource | null {
	if (!isRecord(value)) {
		return null;
	}
	const id = readStringField(value, 'id');
	const type = readStringField(value, 'type');
	if (!id || !type) {
		return null;
	}
	const attributes = isRecord(value['attributes'])
		? value['attributes']
		: undefined;
	const relationships = isRecord(value['relationships'])
		? value['relationships']
		: undefined;
	const links = isRecord(value['links']) ? value['links'] : undefined;
	return { id, type, attributes, relationships, links };
}

function parseInnerPayload(payloadString: string): InnerPayload | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(payloadString);
	} catch {
		return null;
	}
	if (!isRecord(parsed) || !isRecord(parsed['data'])) {
		return null;
	}
	const resource = parseJsonApiResource(parsed['data']);
	if (!resource) {
		return null;
	}
	const included = Array.isArray(parsed['included']) ? parsed['included'] : [];
	const meta = isRecord(parsed['meta']) ? parsed['meta'] : {};
	return { resource, included, meta };
}

function extractAction(eventName: string): string {
	const parts = eventName.split('.');
	return parts[parts.length - 1] ?? 'unknown';
}

function normalizeWebhookOutput({
	deliveryId,
	eventName,
	inner,
}: {
	deliveryId: string | null;
	eventName: string;
	inner: InnerPayload;
}): PcoWebhookTriggerOutput {
	const resource = inner.resource.attributes
		? pcoFlatten.flattenJsonApiResource(inner.resource)
		: {
				id: inner.resource.id,
				type: inner.resource.type,
			};
	const eventTime = readStringField(inner.meta, 'event_time');
	const idempotencyToken = readStringField(inner.meta, 'idempotency_token');
	return {
		event_name: eventName,
		delivery_id: deliveryId,
		event_time: eventTime,
		idempotency_token: idempotencyToken,
		action: extractAction(eventName),
		resource_type: inner.resource.type,
		resource_id: inner.resource.id,
		resource,
		relationships: inner.resource.relationships ?? {},
		meta: inner.meta,
	};
}

function parsePcoWebhookBody(body: unknown): PcoWebhookTriggerOutput | null {
	if (!isRecord(body)) {
		return null;
	}
	const deliveries = body['data'];
	if (!Array.isArray(deliveries) || deliveries.length === 0) {
		return null;
	}
	const delivery = deliveries[0];
	if (!isRecord(delivery)) {
		return null;
	}
	const deliveryId = readStringField(delivery, 'id');
	if (!isRecord(delivery['attributes'])) {
		return null;
	}
	const eventName = readStringField(delivery['attributes'], 'name');
	const payloadString = readStringField(delivery['attributes'], 'payload');
	if (!eventName || !payloadString) {
		return null;
	}
	const inner = parseInnerPayload(payloadString);
	if (!inner) {
		return null;
	}
	return normalizeWebhookOutput({ deliveryId, eventName, inner });
}

export const pcoWebhookParse = {
	parseBody: parsePcoWebhookBody,
	normalize: normalizeWebhookOutput,
};

export type PcoWebhookTriggerOutput = {
	event_name: string;
	delivery_id: string | null;
	event_time: string | null;
	idempotency_token: string | null;
	action: string;
	resource_type: string;
	resource_id: string;
	resource: Record<string, unknown>;
	relationships: Record<string, unknown>;
	meta: Record<string, unknown>;
};

type InnerPayload = {
	resource: JsonApiResource;
	included: unknown[];
	meta: Record<string, unknown>;
};