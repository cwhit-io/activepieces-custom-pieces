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

function parsePlanningCenterCredentials(
	auth: unknown,
): PlanningCenterCredentials | null {
	if (!isRecord(auth)) {
		return null;
	}
	const applicationId = readStringField(auth, 'application_id');
	const secret = readStringField(auth, 'secret');
	if (!applicationId || !secret) {
		return null;
	}
	return { applicationId, secret };
}

export const pcoCredentials = {
	parse: parsePlanningCenterCredentials,
};

export type PlanningCenterCredentials = {
	applicationId: string;
	secret: string;
};