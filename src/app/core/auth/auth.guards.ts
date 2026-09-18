import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthNavigation } from './auth-navigation';
import { AuthStore } from './auth.store';
import { APP_CONFIG, APP_PATHS } from '../config/app-config';

export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  if (auth.isAuthenticated()) {
    return true;
  }

  return inject(Router).createUrlTree([`/${APP_PATHS.login}`], {
    queryParams: { returnUrl: state.url },
  });
};

export const guestOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isAuthenticated()
    ? inject(Router).createUrlTree([inject(APP_CONFIG).defaultAuthenticatedRoute])
    : true;
};

export const landingGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree([`/${APP_PATHS.login}`]);
  }

  const rememberedUrl = inject(AuthNavigation).consume();
  return router.parseUrl(rememberedUrl ?? inject(APP_CONFIG).defaultAuthenticatedRoute);
};
