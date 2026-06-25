import { ALLOWED_API_PREFIXES } from './types';

type HttpErrorShape = {
  response?: {
    status?: number;
    body?: unknown;
  };
  message?: string;
};

function extractPcoMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const record = body as Record<string, unknown>;

  if (typeof record['message'] === 'string') {
    return record['message'];
  }

  if (Array.isArray(record['errors'])) {
    const messages = record['errors']
      .map((error) => {
        if (typeof error === 'string') {
          return error;
        }
        if (error && typeof error === 'object' && typeof (error as Record<string, unknown>)['detail'] === 'string') {
          return (error as Record<string, unknown>)['detail'] as string;
        }
        return undefined;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join('; ');
    }
  }

  return undefined;
}

export function toPlanningCenterError(error: unknown, context: string): Error {
  const httpError = error as HttpErrorShape;
  const status = httpError.response?.status;
  const apiMessage = extractPcoMessage(httpError.response?.body);

  if (status === 401 || status === 403) {
    return new Error(
      `${context}: Authentication failed. Verify your Application ID and Secret have access to the requested resource.`,
    );
  }

  if (status === 404) {
    return new Error(`${context}: Resource not found.`);
  }

  if (status === 429) {
    return new Error(`${context}: Rate limit exceeded. Wait and retry later.`);
  }

  if (apiMessage) {
    return new Error(`${context}: ${apiMessage}`);
  }

  if (typeof httpError.message === 'string' && httpError.message.length > 0) {
    return new Error(`${context}: ${httpError.message}`);
  }

  return new Error(`${context}: Request failed${status ? ` (HTTP ${status})` : ''}.`);
}

export function assertAllowedPath(path: string): void {
  if (!path.startsWith('/')) {
    throw new Error('Path must start with "/" (for example, "/people/v2/people").');
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    throw new Error('Full URLs are not allowed. Provide a path relative to the Planning Center API.');
  }

  const isAllowed = ALLOWED_API_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isAllowed) {
    throw new Error(
      `Path "${path}" is not allowed. Paths must begin with one of: ${ALLOWED_API_PREFIXES.join(', ')}`,
    );
  }
}