import { InjectionToken } from '@angular/core';

export interface LuminaryAppConfig {
  readonly apiBaseUrl: string;
  readonly oidcLoginUrl: string;
  readonly defaultAuthenticatedRoute: string;
}

export const APP_PATHS = {
  login: 'login',
  dashboard: 'dashboard',
  invitationAccept: 'invitations/accept',
  students: 'students',
  profile: 'profile',
} as const;

/**
 * Same-origin defaults work behind both the local Angular proxy and the
 * production reverse proxy. The token can be overridden per deployment.
 */
export const APP_CONFIG = new InjectionToken<LuminaryAppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    apiBaseUrl: '/api/v1',
    oidcLoginUrl: '/oauth2/authorization/luminary',
    defaultAuthenticatedRoute: `/${APP_PATHS.dashboard}`,
  }),
});
