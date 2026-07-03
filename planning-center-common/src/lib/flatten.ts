function flattenValue(
	value: unknown,
	prefix: string,
): Record<string, unknown> {
	if (value === null || value === undefined) {
		return { [prefix]: null };
	}
	if (Array.isArray(value)) {
		const parts = value.map((item) => {
			if (typeof item === 'object' && item !== null) {
				return JSON.stringify(item);
			}
			return String(item);
		});
		return { [prefix]: parts.join(', ') };
	}
	if (typeof value === 'object') {
		return flattenObject(value as Record<string, unknown>, prefix);
	}
	return { [prefix]: value };
}

function flattenObject(
	obj: Record<string, unknown>,
	prefix = '',
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		const flatKey = prefix ? `${prefix}_${key}` : key;
		Object.assign(result, flattenValue(value, flatKey));
	}
	return result;
}

function flattenJsonApiResource(resource: JsonApiResource): Record<string, unknown> {
	const flattened = flattenObject(resource.attributes ?? {}, '');
	return {
		id: resource.id,
		type: resource.type,
		...flattened,
	};
}

export const pcoFlatten = {
	flattenJsonApiResource,
};

export type JsonApiResource = {
	id: string;
	type: string;
	attributes?: Record<string, unknown>;
	relationships?: Record<string, unknown>;
	links?: Record<string, unknown>;
};