import { inject, Injectable } from '@angular/core';

import { APP_CONFIG } from '../config/app-config';

const RETURN_URL_KEY = 'luminary.auth.returnUrl';

@Injectable({ providedIn: 'root' })
export class AuthNavigation {
  private readonly config = inject(APP_CONFIG);
  private redirecting = false;

  remember(returnUrl: string): void {
    if (this.isSafeInternalUrl(returnUrl)) {
      sessionStorage.setItem(RETURN_URL_KEY, returnUrl);
    }
  }

  consume(): string | null {
    const value = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return value && this.isSafeInternalUrl(value) ? value : null;
  }

  beginLogin(returnUrl = this.config.defaultAuthenticatedRoute): void {
    if (this.redirecting) {
      return;
    }

    this.redirecting = true;
    this.remember(returnUrl);
    window.location.assign(this.config.oidcLoginUrl);
  }

  beginLogout(): void {
    if (this.redirecting) {
      return;
    }

    const csrfToken = this.cookieValue('XSRF-TOKEN');
    if (!csrfToken) {
      throw new Error('Çıkış için gerekli CSRF belirteci bulunamadı.');
    }

    this.redirecting = true;
    sessionStorage.removeItem(RETURN_URL_KEY);

    // An XHR logout cannot safely complete Keycloak's redirect chain. Submit
    // a same-origin form so the browser can visit Keycloak and clear its SSO
    // cookie before returning to the login page.
    const form = document.createElement('form');
    form.method = 'post';
    form.action = `${this.config.apiBaseUrl}/auth/logout`;

    const csrfField = document.createElement('input');
    csrfField.type = 'hidden';
    csrfField.name = '_csrf';
    csrfField.value = csrfToken;
    form.appendChild(csrfField);

    document.body.appendChild(form);
    form.submit();
  }

  private cookieValue(name: string): string | null {
    const prefix = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(prefix));

    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
  }

  private isSafeInternalUrl(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
  }
}
