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

  private isSafeInternalUrl(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
  }
}
