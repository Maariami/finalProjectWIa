import { HttpErrorResponse } from '@angular/common/http';

export const readAdminApiError = (error: unknown, fallback: string): string => {
  if (!(error instanceof HttpErrorResponse)) return fallback;

  const body: unknown = error.error;
  if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
    const detail = 'detail' in body && typeof body.detail === 'string' ? body.detail : '';
    const code = 'code' in body && typeof body.code === 'string' ? body.code : '';
    const messages: string[] = [];

    if ('errors' in body && typeof body.errors === 'object' && body.errors !== null) {
      for (const fieldMessages of Object.values(body.errors)) {
        if (Array.isArray(fieldMessages)) {
          messages.push(
            ...fieldMessages.filter((message): message is string => typeof message === 'string'),
          );
        }
      }
    }

    if (messages.length) return messages.join(' ');
    if (detail) return detail;
    if (code) return `Request failed (${code}).`;
  }

  if (error.status === 401) return 'Your session has expired. Sign in again.';
  if (error.status === 403) return 'Administrator access is required.';
  return error.message || fallback;
};
