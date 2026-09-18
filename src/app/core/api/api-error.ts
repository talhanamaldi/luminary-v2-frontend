import { HttpErrorResponse } from '@angular/common/http';

import { ApiProblem } from './api-problem';

export function apiErrorMessage(
  error: unknown,
  fallback = 'İşlem şu anda tamamlanamadı. Lütfen tekrar deneyin.',
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const problem = apiProblem(error);
  return problem?.detail || problem?.title || fallback;
}

export function apiProblem(error: unknown): ApiProblem | null {
  if (!(error instanceof HttpErrorResponse) || !isRecord(error.error)) {
    return null;
  }

  return error.error as ApiProblem;
}

export function apiErrorCode(error: unknown): string | null {
  return apiProblem(error)?.code ?? null;
}

export function apiFieldErrors(error: unknown): Readonly<Record<string, string>> {
  return apiProblem(error)?.fields ?? {};
}

export function apiRequestId(error: unknown): string | null {
  const headerRequestId =
    error instanceof HttpErrorResponse ? error.headers.get('X-Request-Id') : null;
  return headerRequestId ?? apiProblem(error)?.traceId ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
