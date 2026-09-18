import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { apiErrorCode, apiRequestId } from '../api/api-error';
import { AuthNavigation } from '../auth/auth-navigation';
import { RequestCorrelationStore } from './request-correlation.store';

export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);

/** Captures backend request IDs and handles expired sessions consistently. */
export const apiContextInterceptor: HttpInterceptorFn = (request, next) => {
  const correlations = inject(RequestCorrelationStore);
  const navigation = inject(AuthNavigation);
  const router = inject(Router);

  return next(request).pipe(
    tap({
      next: (event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse) {
          correlations.recordResponse(event.headers.get('X-Request-Id'));
        }
      },
      error: (error: unknown) => {
        if (!(error instanceof HttpErrorResponse)) {
          return;
        }

        correlations.recordError(apiRequestId(error), apiErrorCode(error));

        if (error.status === 401 && !request.context.get(SKIP_AUTH_REDIRECT)) {
          navigation.beginLogin(router.url);
        }
      },
    }),
  );
};
