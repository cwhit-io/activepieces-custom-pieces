import crypto from 'crypto';

function rawBodyToString(rawBody: unknown): string | null {
	if (rawBody instanceof Buffer) {
		return rawBody.toString('utf8');
	}
	if (typeof rawBody === 'string') {
		return rawBody;
	}
	return null;
}

function readAuthenticityHeader(
	headers: Record<string, string>,
): string | undefined {
	return (
		headers['x-pco-webhooks-authenticity']
		?? headers['X-PCO-Webhooks-Authenticity']
	);
}

function verifyPcoWebhookAuthenticity({
	secret,
	rawBody,
	headers,
}: {
	secret: string;
	rawBody: unknown;
	headers: Record<string, string>;
}): boolean {
	const authenticityHeader = readAuthenticityHeader(headers);
	if (!authenticityHeader || !secret) {
		return false;
	}
	const bodyString = rawBodyToString(rawBody);
	if (bodyString === null) {
		return false;
	}
	const computed = crypto
		.createHmac('sha256', secret)
		.update(bodyString)
		.digest('hex');
	if (computed.length !== authenticityHeader.length) {
		return false;
	}
	return crypto.timingSafeEqual(
		Buffer.from(computed),
		Buffer.from(authenticityHeader),
	);
}

export const pcoWebhookVerify = {
	verify: verifyPcoWebhookAuthenticity,
};