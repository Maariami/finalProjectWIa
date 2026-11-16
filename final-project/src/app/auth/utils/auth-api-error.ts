import { HttpErrorResponse } from '@angular/common/http';

export type AuthApiError = {
  message: string;
  validationMessages: string[];
};

const errorMessagesByCode: Record<string, string> = {
  invalid_credentials: 'The email or password is incorrect.',
  email_not_confirmed: 'Confirm your email before signing in.',
  account_blocked: 'This account has been blocked. Contact support.',
  email_taken: 'An account with this email already exists.',
  invalid_token: 'This link is invalid or has expired.',
  too_many_requests: 'Too many authentication requests. Please try again later.',
};

export const readAuthApiError = (error: unknown, fallback: string): AuthApiError => {
  if (!(error instanceof HttpErrorResponse)) {
    return { message: fallback, validationMessages: [] };
  }

  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      message: error.status === 429 ? errorMessagesByCode['too_many_requests'] : error.message,
      validationMessages: [],
    };
  }

  const code = 'code' in body && typeof body.code === 'string' ? body.code : '';
  const detail = 'detail' in body && typeof body.detail === 'string' ? body.detail : '';
  const validationMessages: string[] = [];

  if ('errors' in body && typeof body.errors === 'object' && body.errors !== null) {
    for (const messages of Object.values(body.errors)) {
      if (Array.isArray(messages)) {
        validationMessages.push(
          ...messages.filter((message): message is string => typeof message === 'string'),
        );
      }
    }
  }

  return {
    message:
      detail ||
      errorMessagesByCode[code] ||
      (error.status === 429 ? errorMessagesByCode['too_many_requests'] : error.message),
    validationMessages,
  };
};
