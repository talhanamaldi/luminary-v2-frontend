import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Luminary uses a server-side BFF session. Keeping credentials explicit also
 * makes non-production deployments with a separate SPA origin predictable.
 */
export const credentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ withCredentials: true }));
